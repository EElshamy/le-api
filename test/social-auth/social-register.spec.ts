import { faker } from '@faker-js/faker';
import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { SocialRegisterInput } from '../../src/social-auth/inputs/social-register.input';
import { SocialProvidersEnum } from '../../src/social-auth/social-auth.enum';
import {
  UserSocialAccountFactory,
  UserSocialAccountType
} from '../../src/social-auth/social-auth.factory';
import { ActionTypeEnum } from '../../src/user-sessions/user-sessions.enum';
import { UserSession } from '../../src/user-sessions/user-sessions.model';
import { UserVerificationCode } from '../../src/user-verification-code/user-verification-code.model';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import {
  DeviceEnum,
  UserVerificationCodeUseCaseEnum
} from '../../src/user/user.enum';
import { SOCIAL_REGISTER } from '../graphql/social-auth';
import { post } from '../request';
import { rollbackDbForSocialAuth } from './rollback-for-social-auth';

const userVerificationCodeRepo = new (buildRepository(
  UserVerificationCode
))() as IRepository<UserVerificationCode>;

const userSessionsRepo = new (buildRepository(
  UserSession
))() as IRepository<UserSession>;

interface SocialLoginGeneratedData {
  user?: User;
  overrideInput?: Partial<SocialRegisterInput>;
  overrideUser?: Partial<User>;
}

async function generateData(overrideData: SocialLoginGeneratedData = {}) {
  const user = (await UserFactory(true, {
    ...(overrideData.overrideUser || {})
  })) as User;

  const socialAccount = await UserSocialAccountFactory(user, {}, true);
  const input: SocialRegisterInput = {
    provider: socialAccount.provider,
    providerId: socialAccount.providerId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.unverifiedEmail,
    isManuallyEntered: false,
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

describe('check social provider status', () => {
  afterEach(async () => {
    await rollbackDbForSocialAuth();
  });

  it('returns error if provider already exists', async () => {
    const { input } = await generateData({ overrideUser: { email: null } });

    const user = <User>await UserFactory(false);

    await UserSocialAccountFactory(
      user,
      { providerId: input.providerId },
      false
    );

    const res = await post(SOCIAL_REGISTER, { input });

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.SOCIAL_ACCOUNT_EXISTS
    );
  });

  it('registers successfully with email provided from social provider', async () => {
    const { input, user } = await generateData({
      overrideUser: { email: null }
    });

    const res = await post(SOCIAL_REGISTER, { input });

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.token).not.toBeNull();
    expect(res.body.data.response.data.code).not.toBeNull();
    expect(res.body.data.response.data.email).toBe(
      user.unverifiedEmail.toLowerCase()
    );
    expect(res.body.data.response.data.unverifiedEmail).toBeNull();
  });

  it('registers successfully with email provided from manually by user', async () => {
    const { input, user } = await generateData({
      overrideUser: { email: null },
      overrideInput: { isManuallyEntered: true }
    });

    const res = await post(SOCIAL_REGISTER, { input });

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.token).toBeNull();
    expect(res.body.data.response.data.code).toBeNull();
    expect(res.body.data.response.data.unverifiedEmail).toBe(
      user.unverifiedEmail.toLowerCase()
    );
    expect(res.body.data.response.data.email).toBeNull();
  });

  it('sends verification code after register with manual email', async () => {
    const { input, user } = await generateData({
      overrideUser: { email: null },
      overrideInput: { isManuallyEntered: true }
    });

    const res = await post(SOCIAL_REGISTER, { input });

    const verificationCode = await userVerificationCodeRepo.findAll({
      useCase: UserVerificationCodeUseCaseEnum.SOCIAL_EMAIL_VERIFICATION
    });

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.unverifiedEmail).toBe(
      user.unverifiedEmail.toLowerCase()
    );
    expect(verificationCode.length).toBe(1);
    expect(verificationCode[0].userId).toBe(res.body.data.response.data.id);
  });

  it('returns error when trying to register already existing email', async () => {
    const { input, user } = await generateData({
      overrideUser: { email: null }
    });

    await UserFactory(false, { email: user.unverifiedEmail });

    const res = await post(SOCIAL_REGISTER, { input });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.ACCOUNT_EXISTS);
  });

  it('creates signup session after successful register', async () => {
    const { input, user } = await generateData({
      overrideUser: { email: null }
    });

    const res = await post(SOCIAL_REGISTER, { input });

    expect(res.body.data.response.code).toBe(200);

    const userSession = await userSessionsRepo.findOne({
      actionType: ActionTypeEnum.SIGN_UP
    });

    expect(userSession).not.toBeNull();
    expect(userSession.userId).toBe(res.body.data.response.data.id);
  });
});
