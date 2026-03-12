import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { ResetPasswordByEmailInput } from '@src/auth/inputs/reset-password-by-email.input';
import { UserVerificationCode } from '@src/user-verification-code/user-verification-code.model';
import { UserVerificationCodeFactory } from '@src/user-verification-code/verification-code.factory';
import { UserFactory } from '@src/user/factories/user.factory';
import { User } from '@src/user/models/user.model';
import { UserVerificationCodeUseCaseEnum } from '@src/user/user.enum';
import {
  EMAIL,
  INVALID_EMAIL,
  OTHER_EMAIL,
  OTHER_PASSWORD,
  OTHER_VERIFICATION_CODE,
  VALID_PASSWORD,
  VERIFICATION_CODE
} from '../constants';
import { RESET_PASSWORD_BY_EMAIL } from '../graphql/auth';
import { post } from '../request';
import { rollbackDbForAuth } from './rollback-for-auth';

interface LoginGenerateData {
  user?: User;
  verificationCode?: UserVerificationCode;
  overrideInput?: object;
  overrideUserData?: object;
  overrideVerificationCodeData?: object;
}

async function generateData(overrideData: LoginGenerateData = {}) {
  const user =
    overrideData.user ||
    ((await UserFactory(false, {
      email: EMAIL,
      password: VALID_PASSWORD,
      ...(overrideData.overrideUserData || {})
    })) as User);
  const verificationCode =
    overrideData.verificationCode ||
    (await UserVerificationCodeFactory(false, {
      useCase: UserVerificationCodeUseCaseEnum.PASSWORD_RESET,
      userId: user.id,
      code: VERIFICATION_CODE,
      ...(overrideData.overrideVerificationCodeData || {})
    }));
  const input: ResetPasswordByEmailInput = {
    email: user.email,
    verificationCode: verificationCode.code,
    newPassword: OTHER_PASSWORD,
    ...(overrideData.overrideInput || {})
  };
  return { input, user };
}

describe('Reset password by email', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('reset password by email', async () => {
    const { input } = await generateData();

    const res = await post(RESET_PASSWORD_BY_EMAIL, { input });

    expect(res.body.data.response.code).toBe(200);
  });

  it("return error if the there's verification code for different use case", async () => {
    const { input } = await generateData({
      overrideVerificationCodeData: {
        useCase: UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION
      }
    });

    const res = await post(RESET_PASSWORD_BY_EMAIL, { input });

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.INVALID_VERIFICATION_CODE
    );
  });

  it('return error if email is incorrect', async () => {
    const { input } = await generateData({
      overrideInput: { email: OTHER_EMAIL }
    });

    const res = await post(RESET_PASSWORD_BY_EMAIL, { input });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.EMAIL_DOESNT_EXIST);
  });

  it('return error if code is invalid', async () => {
    const { input } = await generateData({
      overrideInput: { verificationCode: OTHER_VERIFICATION_CODE }
    });

    const res = await post(RESET_PASSWORD_BY_EMAIL, { input });

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.INVALID_VERIFICATION_CODE
    );
  });

  it('return error for invalid email', async () => {
    const { input } = await generateData({
      overrideInput: { email: INVALID_EMAIL }
    });

    const res = await post(RESET_PASSWORD_BY_EMAIL, { input });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.INVALID_EMAIL);
  });

  it('return error if the old password is used', async () => {
    const { input } = await generateData({
      overrideInput: { newPassword: VALID_PASSWORD },
      overrideUserData: { password: VALID_PASSWORD }
    });

    const res = await post(RESET_PASSWORD_BY_EMAIL, { input });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.OLD_PASSWORD);
  });
});
