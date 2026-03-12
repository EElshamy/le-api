import { UserSocialAccountFactory } from '../../src/social-auth/social-auth.factory';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import { rollbackDbForSocialAuth } from './rollback-for-social-auth';
import { DisconnectSocialAccountInput } from '../../src/social-auth/inputs/disconnect-social-account.input';
import { DISCONNECT_SOCIAL_ACCOUNT } from '../graphql/social-auth';
import { post } from '../request';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';

interface DisconnectSocialAccountGeneratedData {
  user?: User;
  overrideInput?: Partial<DisconnectSocialAccountInput>;
  overrideUser?: Partial<User>;
}

async function generateData(overrideData: DisconnectSocialAccountGeneratedData = {}) {
  const user = (await UserFactory(
    false,
    {
      ...(overrideData.overrideUser || {})
    },
    true
  )) as User;
  const socialAccount = await UserSocialAccountFactory(user, {}, false);
  const input: DisconnectSocialAccountInput = {
    provider: socialAccount.provider,
    providerId: socialAccount.providerId,
    ...(overrideData.overrideInput || {})
  };
  return { input, user };
}

describe('disconnect social accounts', () => {
  afterEach(async () => {
    await rollbackDbForSocialAuth();
  });

  it('disconnect social account if user has password', async () => {
    const { input, user } = await generateData();

    const res = await post(DISCONNECT_SOCIAL_ACCOUNT, { input }, user.token);
    expect(res.body.data.response.data).toBeTruthy();
  });

  it('returns error if unauthorized', async () => {
    const { input } = await generateData();

    const res = await post(DISCONNECT_SOCIAL_ACCOUNT, { input });
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it("returns error if it's the only login method", async () => {
    const { input, user } = await generateData({ overrideUser: { password: null } });

    const res = await post(DISCONNECT_SOCIAL_ACCOUNT, { input }, user.token);
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.DISCONNECTION_FAILED);
  });

  it('disconnect social account if user has another social provider linked', async () => {
    const { input, user } = await generateData({ overrideUser: { password: null } });
    await UserSocialAccountFactory(user);

    const res = await post(DISCONNECT_SOCIAL_ACCOUNT, { input }, user.token);
    expect(res.body.data.response.data).toBeTruthy();
  });

  it("returns error if the social provider doesn't belong to the user", async () => {
    const { input, user } = await generateData({ overrideUser: { password: null } });
    const socialAccount = await UserSocialAccountFactory(user, {}, true);

    const res = await post(
      DISCONNECT_SOCIAL_ACCOUNT,
      { input: { provider: socialAccount.provider, providerId: socialAccount.providerId } },
      user.token
    );
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.SOCIAL_ACCOUNT_DOESNT_EXIST);
  });

  it('return error when attempting disconnection twice', async () => {
    const { input, user } = await generateData();

    const res = await post(DISCONNECT_SOCIAL_ACCOUNT, { input }, user.token);
    expect(res.body.data.response.data).toBeTruthy();

    const res2 = await post(DISCONNECT_SOCIAL_ACCOUNT, { input }, user.token);
    expect(res2.body.data.response.code).toBe(ErrorCodeEnum.SOCIAL_ACCOUNT_DOESNT_EXIST);
  });
});
