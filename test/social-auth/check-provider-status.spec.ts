import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { CheckSocialStatusInput } from '../../src/social-auth/inputs/check-social-status.input';
import { SocialAccountRequiredActionEnum } from '../../src/social-auth/social-auth.enum';
import {
  UserSocialAccountFactory,
  UserSocialAccountType
} from '../../src/social-auth/social-auth.factory';
import { UserVerificationCode } from '../../src/user-verification-code/user-verification-code.model';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import { UserVerificationCodeUseCaseEnum } from '../../src/user/user.enum';
import { CHECK_SOCIAL_PROVIDER_STATUS } from '../graphql/social-auth';
import { post } from '../request';
import { rollbackDbForSocialAuth } from './rollback-for-social-auth';

interface CheckStatusGeneratedData {
  user?: User;
  overrideInput?: Partial<CheckSocialStatusInput>;
  overrideUser?: Partial<User>;
  createUser?: boolean;
}

async function generateData(overrideData: CheckStatusGeneratedData = {}) {
  const returnUserInputOnly =
    overrideData.createUser !== undefined ? !overrideData.createUser : true;

  const user = (await UserFactory(returnUserInputOnly, {
    ...(overrideData.overrideUser || {})
  })) as User;
  const socialAccount = await UserSocialAccountFactory(user, {}, true);
  const input: CheckSocialStatusInput = {
    provider: socialAccount.provider,
    providerId: socialAccount.providerId,
    email: user.email,
    isManuallyEntered: false,
    providerAuth: {
      authToken: (<UserSocialAccountType>socialAccount).authToken
    },
    ...(overrideData.overrideInput || {})
  };
  return { input, user };
}

const userVerificationCodeRepo = new (buildRepository(
  UserVerificationCode
))() as IRepository<UserVerificationCode>;

describe('check social provider status', () => {
  afterEach(async () => {
    await rollbackDbForSocialAuth();
  });

  it('returns status as register', async () => {
    const { input } = await generateData();
    const res = await post(CHECK_SOCIAL_PROVIDER_STATUS, { input });

    expect(res.body.data.response.data.actionRequired).toBe(
      SocialAccountRequiredActionEnum.REGISTER
    );
    expect(res.body.data.response.data.user).toBeNull();
  });

  it('requires register verification', async () => {
    const { input } = await generateData({ overrideInput: { isManuallyEntered: true } });
    const res = await post(CHECK_SOCIAL_PROVIDER_STATUS, { input });

    expect(res.body.data.response.data.actionRequired).toBe(
      SocialAccountRequiredActionEnum.REGISTER_VERIFICATION
    );
    expect(res.body.data.response.data.user).toBeNull();
  });

  it('returns status as merge', async () => {
    const { input } = await generateData({ createUser: true, overrideUser: { code: 'U-56777' } });
    const res = await post(CHECK_SOCIAL_PROVIDER_STATUS, { input });

    expect(res.body.data.response.data.actionRequired).toBe(SocialAccountRequiredActionEnum.MERGE);
    expect(res.body.data.response.data.user.token).not.toBeNull();
  });

  it('requires verification before mergs', async () => {
    const { input } = await generateData({
      createUser: true,
      overrideInput: { isManuallyEntered: true }
    });
    const res = await post(CHECK_SOCIAL_PROVIDER_STATUS, { input });

    expect(res.body.data.response.data.actionRequired).toBe(
      SocialAccountRequiredActionEnum.VERIFICATION_MERGE
    );
    expect(res.body.data.response.data.user.token).toBeNull();
    expect(res.body.data.response.data.user.code).toBeNull();
  });

  it('returns status as merge', async () => {
    const { input, user } = await generateData({
      createUser: true,
      overrideUser: { code: 'U-56777' }
    });

    await UserSocialAccountFactory(user, { provider: input.provider }, false);

    const res = await post(CHECK_SOCIAL_PROVIDER_STATUS, { input });

    expect(res.body.data.response.data.actionRequired).toBe(
      SocialAccountRequiredActionEnum.MERGE_SAME_PROVIDER
    );
    expect(res.body.data.response.data.user.token).not.toBeNull();
  });

  it('requires verification before merge for manual email', async () => {
    const { input, user } = await generateData({
      createUser: true,
      overrideInput: { isManuallyEntered: true }
    });
    await UserSocialAccountFactory(user, { provider: input.provider }, false);

    const res = await post(CHECK_SOCIAL_PROVIDER_STATUS, { input });

    expect(res.body.data.response.data.actionRequired).toBe(
      SocialAccountRequiredActionEnum.VERIFICATION_MERGE_SAME_PROVIDER
    );
    expect(res.body.data.response.data.user.token).toBeNull();
    expect(res.body.data.response.data.user.code).toBeNull();
  });

  it('sends verification code for manual email before merge', async () => {
    const { input, user } = await generateData({
      createUser: true,
      overrideInput: { isManuallyEntered: true }
    });
    await UserSocialAccountFactory(user, { provider: input.provider }, false);

    const res = await post(CHECK_SOCIAL_PROVIDER_STATUS, { input });

    expect(res.body.data.response.data.actionRequired).toBe(
      SocialAccountRequiredActionEnum.VERIFICATION_MERGE_SAME_PROVIDER
    );

    const verificationCode = await userVerificationCodeRepo.findOne({
      userId: user.id,
      useCase: UserVerificationCodeUseCaseEnum.SOCIAL_EMAIL_VERIFICATION
    });

    expect(verificationCode).not.toBeNull();
  });
});
