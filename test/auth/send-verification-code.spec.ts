import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { SendEmailVerificationCodeInput } from '../../src/auth/inputs/send-email-verification-code.input';
import { UserVerificationCode } from '../../src/user-verification-code/user-verification-code.model';
import { UserVerificationCodeFactory } from '../../src/user-verification-code/verification-code.factory';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import { UserVerificationCodeUseCaseEnum } from '../../src/user/user.enum';
import { EMAIL, VERIFICATION_CODE } from '../constants';
import { SEND_EMAIL_VERIFICATION_CODE } from '../graphql/auth';
import { post } from '../request';
import { rollbackDbForAuth } from './rollback-for-auth';

interface UserSessionGeneratedDataInput {
  user?: User;
  overrideInput?: Partial<SendEmailVerificationCodeInput>;
  overrideUser?: Partial<User>;
  overrideVerificationCodeData?: Partial<UserVerificationCode>;
}

const userVerificationCodeRepo = new (buildRepository(
  UserVerificationCode
))() as IRepository<UserVerificationCode>;

async function generateData(overrideData: UserSessionGeneratedDataInput = {}) {
  const user =
    overrideData.user ||
    ((await UserFactory(false, { ...overrideData.overrideUser })) as User);

  const verificationCode = await UserVerificationCodeFactory(false, {
    useCase: UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION,
    userId: user.id,
    code: VERIFICATION_CODE,
    ...(overrideData.overrideVerificationCodeData || {})
  });

  const input: SendEmailVerificationCodeInput = {
    email: user.unverifiedEmail,
    useCase: UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION,
    ...overrideData.overrideInput
  };
  return { user, input };
}

describe('send and resend verification code for various use cases', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('resends email verification code successfully', async () => {
    const { input } = await generateData({ overrideUser: { email: null } });
    const res = await post(SEND_EMAIL_VERIFICATION_CODE, { input });

    expect(res.body.data.response.code).toBe(200);
  });

  it('sends password reset verification code successfully', async () => {
    const { input } = await generateData({
      overrideUser: { unverifiedEmail: null, email: EMAIL },
      overrideInput: {
        useCase: UserVerificationCodeUseCaseEnum.PASSWORD_RESET,
        email: EMAIL
      }
    });
    const res = await post(SEND_EMAIL_VERIFICATION_CODE, { input });

    expect(res.body.data.response.code).toBe(200);
  });

  it('removes old verification code and creates new one on resend', async () => {
    const { input, user } = await generateData({
      overrideUser: { email: null },
      overrideVerificationCodeData: { code: '4567' }
    });

    const oldCode = await userVerificationCodeRepo.findOne({
      userId: user.id,
      useCase: UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION
    });

    const res = await post(SEND_EMAIL_VERIFICATION_CODE, { input });

    const newCode = await userVerificationCodeRepo.findOne({
      userId: user.id,
      useCase: UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION
    });

    expect(res.body.data.response.code).toBe(200);

    expect(oldCode.id).not.toBeNull();
    expect(newCode.id).not.toBeNull();
    expect(oldCode.id).not.toBe(newCode.id);
    expect(oldCode.code).not.toBe(newCode.code);
  });

  it('returns error if email does not exist for email verification', async () => {
    const { input } = await generateData({
      overrideUser: { email: null },
      overrideInput: { email: EMAIL }
    });
    const res = await post(SEND_EMAIL_VERIFICATION_CODE, { input });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.EMAIL_DOESNT_EXIST);
  });

  it('returns error if email is already verified for email verification', async () => {
    const { input } = await generateData({
      overrideUser: { email: EMAIL, unverifiedEmail: null },
      overrideInput: { email: EMAIL }
    });
    const res = await post(SEND_EMAIL_VERIFICATION_CODE, { input });

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.EMAIL_ALREADY_VERIFIED
    );
  });

  it('returns error if email does not exist for password reset', async () => {
    const { input } = await generateData({
      overrideInput: { email: EMAIL }
    });
    const res = await post(SEND_EMAIL_VERIFICATION_CODE, { input });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.EMAIL_DOESNT_EXIST);
  });

  it('returns error if email is not yet verified for password reset', async () => {
    const { input } = await generateData({
      overrideUser: { unverifiedEmail: EMAIL, email: null },
      overrideInput: {
        email: EMAIL,
        useCase: UserVerificationCodeUseCaseEnum.PASSWORD_RESET
      }
    });
    const res = await post(SEND_EMAIL_VERIFICATION_CODE, { input });

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.USER_EMAIL_IS_NOT_VERIFIED_YET
    );
  });
});
