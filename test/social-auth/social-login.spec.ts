import { faker } from '@faker-js/faker';
import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { SocialLoginInput } from '../../src/social-auth/inputs/social-login-input';
import { SocialProvidersEnum } from '../../src/social-auth/social-auth.enum';
import { UserSocialAccountFactory } from '../../src/social-auth/social-auth.factory';
import { ActionTypeEnum } from '../../src/user-sessions/user-sessions.enum';
import { UserSession } from '../../src/user-sessions/user-sessions.model';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import { DeviceEnum } from '../../src/user/user.enum';
import { ME } from '../graphql/auth';
import { SOCIAL_LOGIN } from '../graphql/social-auth';
import { post } from '../request';
import { rollbackDbForSocialAuth } from './rollback-for-social-auth';

interface SocialLoginGeneratedData {
  user?: User;
  overrideInput?: Partial<SocialLoginInput>;
  overrideUser?: Partial<User>;
}

async function generateData(overrideData: SocialLoginGeneratedData = {}) {
  const user = (await UserFactory(false, {
    ...(overrideData.overrideUser || {})
  })) as User;
  const socialAccount = await UserSocialAccountFactory(user, {}, false);
  const input: SocialLoginInput = {
    provider: socialAccount.provider,
    providerId: socialAccount.providerId,
    loginDetails: {
      device: <DeviceEnum>(
        (<unknown>(
          (socialAccount.provider === SocialProvidersEnum.APPLE
            ? DeviceEnum.IOS
            : faker.helpers.arrayElement(Object.keys(DeviceEnum)))
        ))
      ),
      deviceName: faker.word.words()
    },
    ...(overrideData.overrideInput || {})
  };
  return { input, user };
}

const userSessionsRepo = new (buildRepository(
  UserSession
))() as IRepository<UserSession>;

describe('check social provider status', () => {
  afterEach(async () => {
    await rollbackDbForSocialAuth();
  });

  it('successfully login with social provider', async () => {
    const { input, user } = await generateData();
    const res = await post(SOCIAL_LOGIN, { input });

    expect(res.body.data.response.data.token).not.toBeNull();
    expect(res.body.data.response.data.id).toBe(user.id);
  });

  it("throws error if there's no user exists for the input", async () => {
    const { input } = await generateData({
      overrideInput: { providerId: '12345567' }
    });
    const res = await post(SOCIAL_LOGIN, { input });

    expect(res.body.data.response.data).toBeNull();
    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.SOCIAL_ACCOUNT_DOESNT_EXIST
    );
  });

  it('creates login session after successful login', async () => {
    const { input, user } = await generateData();
    const res = await post(SOCIAL_LOGIN, { input });

    expect(res.body.data.response.data.token).not.toBeNull();
    expect(res.body.data.response.data.id).toBe(user.id);

    const userSession = await userSessionsRepo.findOne({
      actionType: ActionTypeEnum.LOGIN
    });

    expect(userSession).not.toBeNull();
    expect(userSession.userId).toBe(res.body.data.response.data.id);
  });

  it('validates token returned from login', async () => {
    const { input, user } = await generateData();
    const res = await post(SOCIAL_LOGIN, { input });

    expect(res.body.data.response.data.token).not.toBeNull();
    expect(res.body.data.response.data.id).toBe(user.id);

    const meRes = await post(ME, {}, res.body.data.response.data.token);

    expect(meRes.body.data.response.code).toBe(200);
    expect(meRes.body.data.response.data.id).toBe(user.id);
  });
});
