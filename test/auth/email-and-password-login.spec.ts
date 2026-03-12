import { faker } from '@faker-js/faker';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { EmailAndPasswordLoginInput } from '@src/auth/inputs/email-password-login.input';
import { UserFactory } from '@src/user/factories/user.factory';
import { User } from '@src/user/models/user.model';
import { DeviceEnum } from '@src/user/user.enum';
import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { ActionTypeEnum } from '../../src/user-sessions/user-sessions.enum';
import { UserSession } from '../../src/user-sessions/user-sessions.model';
import {
  EMAIL,
  INVALID_EMAIL,
  OTHER_EMAIL,
  OTHER_PASSWORD,
  VALID_PASSWORD
} from '../constants';
import { EMAIL_AND_PASSWORD_LOGIN, ME } from '../graphql/auth';
import { post } from '../request';
import { rollbackDbForAuth } from './rollback-for-auth';

const userSessionsRepo = new (buildRepository(
  UserSession
))() as IRepository<UserSession>;

interface LoginGenerateData {
  user?: User;
  overrideInput?: object;
  overrideUserData?: object;
}

async function generateData(overrideData: LoginGenerateData = {}) {
  const user =
    overrideData.user ||
    ((await UserFactory(false, {
      email: EMAIL,
      password: VALID_PASSWORD,
      isBlocked: false,
      ...(overrideData.overrideUserData || {})
    })) as User);
  const input: EmailAndPasswordLoginInput = {
    email: EMAIL,
    password: VALID_PASSWORD,
    loginDetails: {
      device: <DeviceEnum>(
        (<unknown>faker.helpers.arrayElement(Object.keys(DeviceEnum)))
      ),
      deviceName: faker.word.words()
    },
    ...(overrideData.overrideInput || {})
  };

  return { input, user };
}

describe('email and password login', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('login with email and password successfully', async () => {
    const { input } = await generateData();

    const res = await post(EMAIL_AND_PASSWORD_LOGIN, { input });

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.token).toBeTruthy();
  });

  it('return error for invalid password', async () => {
    const { input } = await generateData({
      overrideUserData: { password: OTHER_PASSWORD }
    });

    const res = await post(EMAIL_AND_PASSWORD_LOGIN, { input });

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.INCORRECT_EMAIL_OR_PASSWORD
    );
  });

  it('return error if user is blocked', async () => {
    const { input } = await generateData({
      overrideUserData: { isBlocked: true }
    });

    const res = await post(EMAIL_AND_PASSWORD_LOGIN, { input });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.BLOCKED_USER);
  });

  it("return error if email doesn't exist", async () => {
    const { input } = await generateData({
      overrideInput: { email: OTHER_EMAIL }
    });

    const res = await post(EMAIL_AND_PASSWORD_LOGIN, { input });

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.INCORRECT_EMAIL_OR_PASSWORD
    );
  });

  it('return error if email is invalid', async () => {
    const { input } = await generateData({
      overrideInput: { email: INVALID_EMAIL }
    });

    const res = await post(EMAIL_AND_PASSWORD_LOGIN, { input });
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.INVALID_EMAIL);
  });

  it('creates user session after login', async () => {
    const { input } = await generateData();

    const res = await post(EMAIL_AND_PASSWORD_LOGIN, { input });

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.token).toBeTruthy();

    const userSession = await userSessionsRepo.findOne({
      userId: res.body.data.response.data.id,
      actionType: ActionTypeEnum.LOGIN
    });

    expect(userSession).not.toBeNull();
    expect(userSession.isActive).toBeTruthy();
  });

  it('validates token returned from login', async () => {
    const { input, user } = await generateData();

    const loginRes = await post(EMAIL_AND_PASSWORD_LOGIN, { input });

    expect(loginRes.body.data.response.code).toBe(200);
    expect(loginRes.body.data.response.data.token).toBeTruthy();

    const meRes = await post(ME, {}, loginRes.body.data.response.data.token);

    expect(meRes.body.data.response.code).toBe(200);
    expect(meRes.body.data.response.data.id).toBe(user.id);
  });

  it('returns error if the user does not have a password', async () => {
    const { input, user } = await generateData({
      overrideUserData: { password: null }
    });

    const loginRes = await post(EMAIL_AND_PASSWORD_LOGIN, { input });

    expect(loginRes.body.data.response.code).toBe(ErrorCodeEnum.NO_PASSWORD);
  });
});
