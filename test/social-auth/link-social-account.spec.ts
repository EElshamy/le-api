import {
  UserSocialAccountFactory,
  UserSocialAccountType
} from '../../src/social-auth/social-auth.factory';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import { rollbackDbForSocialAuth } from './rollback-for-social-auth';
import { LINK_SOCIAL_ACCOUNT } from '../graphql/social-auth';
import { post } from '../request';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { LinkSocialAccountInput } from '../../src/social-auth/inputs/link-social-account.input';
import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { UserSocialAccount } from '../../src/social-auth/user-social-account.model';
import { SocialProvidersEnum } from '../../src/social-auth/social-auth.enum';

interface LinkSocialAccountGeneratedData {
  user?: User;
  overrideInput?: Partial<LinkSocialAccountInput>;
  overrideUser?: Partial<User>;
}

async function generateData(overrideData: LinkSocialAccountGeneratedData = {}) {
  const user = (await UserFactory(
    false,
    {
      ...(overrideData.overrideUser || {})
    },
    true
  )) as User;
  const socialAccount = await UserSocialAccountFactory(
    user,
    {
      ...(overrideData.overrideInput || {})
    },
    false
  );

  const input: LinkSocialAccountInput = {
    provider: socialAccount.provider,
    providerId: socialAccount.providerId,
    providerAuth: {
      authToken: (<UserSocialAccountType>socialAccount).authToken ?? 'eyljdafkfkk'
    },
    ...(overrideData.overrideInput || {})
  };
  return { input, user };
}

const userSocialAccountRepo = new (buildRepository(
  UserSocialAccount
))() as IRepository<UserSocialAccount>;

describe('link social account', () => {
  afterEach(async () => {
    await rollbackDbForSocialAuth();
  });

  it('returns error if unauthorized', async () => {
    const { input } = await generateData();

    const res = await post(LINK_SOCIAL_ACCOUNT, { input });
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('links another social provider successfully', async () => {
    const { user } = await generateData({
      overrideInput: { provider: SocialProvidersEnum.FACEBOOK }
    });

    const socialAccount = await UserSocialAccountFactory(
      user,
      { provider: SocialProvidersEnum.GOOGLE },
      true
    );

    const res = await post(
      LINK_SOCIAL_ACCOUNT,
      {
        input: {
          provider: socialAccount.provider,
          providerId: socialAccount.providerId,
          providerAuth: {
            authToken: (<UserSocialAccountType>socialAccount).authToken
          }
        }
      },
      user.token
    );
    expect(res.body.data.response.code).toBe(200);

    const socialAccounts = await userSocialAccountRepo.findAll({ userId: user.id });
    expect(socialAccounts.length).toBe(2);
  });

  it('returns error if other user linked the same provider', async () => {
    const { user } = await generateData({
      overrideInput: { provider: SocialProvidersEnum.GOOGLE }
    });

    const { user: secondUser, input } = await generateData({
      overrideInput: { provider: SocialProvidersEnum.FACEBOOK }
    });

    const res = await post(LINK_SOCIAL_ACCOUNT, { input }, user.token);
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.SOCIAL_ACCOUNT_EXISTS);
  });

  it('returns error if user linked the same type of provider', async () => {
    const { user, input } = await generateData();


    const res = await post(
      LINK_SOCIAL_ACCOUNT,
      { input: { ...input, providerId: '12345566' } },
      user.token
    );

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.SAME_PROVIDER_CONNECTED);
  });
});
