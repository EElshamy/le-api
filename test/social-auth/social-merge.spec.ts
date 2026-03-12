import { faker } from '@faker-js/faker';
import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { SocialMergeInput } from '../../src/social-auth/inputs/social-merge.input';
import { SocialProvidersEnum } from '../../src/social-auth/social-auth.enum';
import {
  UserSocialAccountFactory,
  UserSocialAccountType
} from '../../src/social-auth/social-auth.factory';
import { UserSocialAccount } from '../../src/social-auth/user-social-account.model';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import { DeviceEnum } from '../../src/user/user.enum';
import { EMAIL } from '../constants';
import { ME } from '../graphql/auth';
import { SOCIAL_MERGE } from '../graphql/social-auth';
import { post } from '../request';
import { rollbackDbForSocialAuth } from './rollback-for-social-auth';

interface SocialMergeGeneratedData {
  user?: User;
  overrideInput?: Partial<SocialMergeInput>;
  overrideUser?: Partial<User>;
  createUser?: boolean;
}

async function generateData(overrideData: SocialMergeGeneratedData = {}) {
  const returnUserInputOnly =
    overrideData.createUser !== undefined ? !overrideData.createUser : true;

  const user = (await UserFactory(
    returnUserInputOnly,
    {
      ...(overrideData.overrideUser || {})
    },
    !returnUserInputOnly
  )) as User;
  const socialAccount = await UserSocialAccountFactory(user, {}, true);
  const input: SocialMergeInput = {
    provider: socialAccount.provider,
    providerId: socialAccount.providerId,
    email: user.email,
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
    providerAuth: {
      authToken: (<UserSocialAccountType>socialAccount).authToken
    },
    ...(overrideData.overrideInput || {})
  };
  return { input, user };
}

const userSocialAccountRepo = new (buildRepository(
  UserSocialAccount
))() as IRepository<UserSocialAccount>;

describe('check social provider status', () => {
  afterEach(async () => {
    await rollbackDbForSocialAuth();
  });

  it('returns error if user is unauthorized', async () => {
    const { input } = await generateData();
    const res = await post(SOCIAL_MERGE, { input });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('merges accounts successfully', async () => {
    const { input, user } = await generateData({ createUser: true });
    const res = await post(SOCIAL_MERGE, { input }, user.token);

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.token).not.toBeNull();

    const userSocialAccount = await userSocialAccountRepo.findOne({
      userId: user.id,
      providerId: input.providerId
    });

    expect(userSocialAccount).not.toBeNull();
  });

  it('replaces already existing provider and merges the new one for the same provider type', async () => {
    const { input, user } = await generateData({ createUser: true });

    await UserSocialAccountFactory(user, {
      ...input,
      providerId: '567890'
    });
    const res = await post(SOCIAL_MERGE, { input }, user.token);

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.token).not.toBeNull();

    const userSocialAccount = await userSocialAccountRepo.findOne({
      userId: user.id,
      provider: input.provider
    });

    expect(userSocialAccount).not.toBeNull();
    expect(userSocialAccount.providerId).toBe(input.providerId);
  });

  it('adds the new provider to the list if the user has different provider type', async () => {
    const { input, user } = await generateData({
      createUser: true,
      overrideInput: { provider: SocialProvidersEnum.GOOGLE }
    });

    await UserSocialAccountFactory(user, {
      ...input,
      provider: SocialProvidersEnum.FACEBOOK,
      providerId: '567890'
    });

    const res = await post(SOCIAL_MERGE, { input }, user.token);

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.token).not.toBeNull();

    const userSocialAccount = await userSocialAccountRepo.findAll({
      userId: user.id
    });

    expect(userSocialAccount).not.toBeNull();
    expect(userSocialAccount.length).toBe(2);
  });

  it("returns error if email doesn't exist", async () => {
    const { input, user } = await generateData({
      createUser: true,
      overrideInput: { email: EMAIL }
    });
    const res = await post(SOCIAL_MERGE, { input }, user.token);

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.EMAIL_DOESNT_EXIST);
  });

  it('validates token returned from social login', async () => {
    const { input, user } = await generateData({ createUser: true });
    const res = await post(SOCIAL_MERGE, { input }, user.token);

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.token).not.toBeNull();

    const meRes = await post(ME, {}, res.body.data.response.data.token);

    expect(meRes.body.data.response.code).toBe(200);
    expect(meRes.body.data.response.data.id).toBe(user.id);
  });
});
