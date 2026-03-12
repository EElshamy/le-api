import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { CodePrefix } from '../../src/_common/utils/helpers.enum';
import { VerifyUserByEmailInput } from '../../src/auth/inputs/verify-user-by-email.input';
import { UserVerificationCodeFactory } from '../../src/user-verification-code/verification-code.factory';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import {
  UserVerificationCodeUseCaseEnum,
  VerificationCodeUseCasesEnum
} from '../../src/user/user.enum';
import {
  EMAIL,
  OTHER_EMAIL,
  OTHER_VERIFICATION_CODE,
  PAST_TIME,
  VERIFICATION_CODE
} from '../constants';
import { ME, VERIFY_USER_BY_EMAIL } from '../graphql/auth';
import { post } from '../request';
import { rollbackDbForAuth } from './rollback-for-auth';

interface VerifyUserPhoneGenerateData {
  user?: User;
  overrideInput?: object;
  overrideVerificationCodeData?: object;
  overrideUser?: any;
}

async function generateData(overrideData: VerifyUserPhoneGenerateData = {}) {
  const user =
    overrideData.user ||
    ((await UserFactory(
      false,
      { ...(overrideData.overrideUser || { email: null }) },
      overrideData?.overrideUser?.includeSession
    )) as User);
  const verificationCode = await UserVerificationCodeFactory(false, {
    useCase: UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION,
    userId: user.id,
    code: VERIFICATION_CODE,
    ...(overrideData.overrideVerificationCodeData || {})
  });
  const input: VerifyUserByEmailInput = {
    email: user.unverifiedEmail,
    verificationCode: verificationCode.code,
    useCase: VerificationCodeUseCasesEnum.EMAIL_VERIFICATION,
    ...(overrideData.overrideInput || {})
  };
  return { input, user };
}

describe('Verify user email suite test', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('verify user email', async () => {
    const { input, user } = await generateData({
      overrideUser: { email: null }
    });

    const res = await post(VERIFY_USER_BY_EMAIL, { input });

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.unverifiedEmail).toBeNull();
    expect(res.body.data.response.data.email).toBe(user.unverifiedEmail);
    expect(res.body.data.response.data.code).not.toBeNull();
    expect(res.body.data.response.data.code).toContain(`${CodePrefix.USER}-`);
  });

  it('return error if verification code is incorrect', async () => {
    const { input } = await generateData({
      overrideInput: { verificationCode: OTHER_VERIFICATION_CODE }
    });

    const res = await post(VERIFY_USER_BY_EMAIL, { input });

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.INVALID_VERIFICATION_CODE
    );
  });

  it("return error if email doesn't exist", async () => {
    const { input } = await generateData({
      overrideInput: { email: OTHER_EMAIL }
    });

    const res = await post(VERIFY_USER_BY_EMAIL, { input });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.EMAIL_DOESNT_EXIST);
  });

  it('return error if email is already verified', async () => {
    const { input } = await generateData({
      overrideInput: { email: EMAIL },
      overrideUser: { email: EMAIL, unverifiedEmail: null }
    });

    const res = await post(VERIFY_USER_BY_EMAIL, { input });

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.EMAIL_ALREADY_VERIFIED
    );
  });

  it('return error for expired code', async () => {
    const { input } = await generateData({
      overrideVerificationCodeData: { expiryDate: PAST_TIME }
    });

    const res = await post(VERIFY_USER_BY_EMAIL, { input });
    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.INVALID_VERIFICATION_CODE
    );
  });

  it('validates token returned from verification', async () => {
    const { input, user } = await generateData({
      overrideUser: { includeSession: true, email: null }
    });

    const verificationRes = await post(VERIFY_USER_BY_EMAIL, { input });

    expect(verificationRes.body.data.response.code).toBe(200);

    const meRes = await post(
      ME,
      {},
      verificationRes.body.data.response.data.token
    );

    expect(meRes.body.data.response.code).toBe(200);
    expect(meRes.body.data.response.data.id).toBe(user.id);
  });

  it('returns error if other user has verified the same email', async () => {
    const { input, user } = await generateData({
      overrideUser: { email: null }
    });

    await UserFactory(false, { email: user.unverifiedEmail });

    const res = await post(VERIFY_USER_BY_EMAIL, { input });

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.CHOOSE_ANOTHER_EMAIL
    );
  });
});
