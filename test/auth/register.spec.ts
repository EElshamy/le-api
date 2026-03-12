import { faker } from '@faker-js/faker/locale/af_ZA';
import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { RegisterInput } from '@src/auth/inputs/register.input';
import { UserFactory } from '@src/user/factories/user.factory';
import { User } from '@src/user/models/user.model';
import { DeviceEnum, UserRoleEnum } from '@src/user/user.enum';
import { ApprovalStatusEnum } from '../../src/lecturer/enums/lecturer.enum';
import { LecturerFactory } from '../../src/lecturer/factories/lecturer.factory';
import { ActionTypeEnum } from '../../src/user-sessions/user-sessions.enum';
import { UserSession } from '../../src/user-sessions/user-sessions.model';
import { INVALID_EMAIL, INVALID_PASSWORD, VALID_PASSWORD } from '../constants';
import { REGISTER } from '../graphql/auth';
import { post } from '../request';
import { rollbackDbForAuth } from './rollback-for-auth';

const userRepo = new (buildRepository(User))() as IRepository<User>;
const userSessionsRepo = new (buildRepository(
  UserSession
))() as IRepository<UserSession>;

interface RegisterGenerateData {
  overrideInput?: object;
  overrideUser?: object;
}

async function generateData(overrideData: RegisterGenerateData = {}) {
  const user = (await UserFactory(true, {
    ...(overrideData.overrideUser || {})
  })) as User;
  const input: RegisterInput = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
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

describe('Register suite test', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('register successfully', async () => {
    const { input } = await generateData({
      overrideUser: { role: UserRoleEnum.USER }
    });

    const { body } = await post(REGISTER, { input });

    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data.token).toBeUndefined();
    expect(body.data.response.data.email).toBe(null);
    expect(body.data.response.data.code).toBe(null);
    expect(body.data.response.data.unverifiedEmail).toBe(
      input.email.toLowerCase()
    );
  });

  it('return error if email already exists', async () => {
    const user = await UserFactory(false);
    const { input } = await generateData({
      overrideInput: { email: user.email }
    });

    const { body } = await post(REGISTER, { input });
    expect(body.data.response.code).toBe(ErrorCodeEnum.EMAIL_ALREADY_EXISTS);
  });

  it('delete duplicated users with same not verified email', async () => {
    const user = await UserFactory(false, { email: null });
    const { input } = await generateData({
      overrideInput: { email: user.unverifiedEmail }
    });

    const usersWithTheSameUnverifiedEmailBeforeRegister =
      await userRepo.findAll({
        unverifiedEmail: user.unverifiedEmail
      });

    const res = await post(REGISTER, { input });

    const usersWithSameUnverifiedEmail = await userRepo.findAll({
      unverifiedEmail: user.unverifiedEmail
    });

    expect(res.body.data.response.code).toBe(200);
    expect(usersWithTheSameUnverifiedEmailBeforeRegister.length).toBe(1);
    expect(usersWithSameUnverifiedEmail.length).toBe(1);
    expect(usersWithTheSameUnverifiedEmailBeforeRegister[0].email).toBeNull();
    expect(usersWithTheSameUnverifiedEmailBeforeRegister[0].id).not.toBe(
      usersWithSameUnverifiedEmail[0].id
    );
  });

  it('return error for invalid email', async () => {
    const { input } = await generateData({
      overrideInput: { email: INVALID_EMAIL }
    });

    const res = await post(REGISTER, { input });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.INVALID_EMAIL);
  });

  it('return error for invalid password', async () => {
    const { input } = await generateData({
      overrideInput: { password: INVALID_PASSWORD }
    });

    const res = await post(REGISTER, { input });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.INVALID_PASSWORD);
  });

  it('creates user session after registeration', async () => {
    const { input } = await generateData();

    const { body } = await post(REGISTER, { input });

    const userSession = await userSessionsRepo.findOne({
      userId: body.data.response.data.id,
      actionType: ActionTypeEnum.SIGN_UP
    });

    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data.token).toBeUndefined();

    expect(userSession).not.toBeNull();
    expect(userSession.isActive).toBeTruthy();
  });

  it('returns success for rejected lecturer email', async () => {
    const user = await UserFactory(false, {
      isBlocked: false,
      role: UserRoleEnum.LECTURER
    });
    await LecturerFactory({
      userId: user.id,
      status: ApprovalStatusEnum.REJECTED
    });

    const { input } = await generateData({
      overrideInput: { email: user.email }
    });

    const { body } = await post(REGISTER, { input });

    expect(body.data.response.code).toBe(200);
  });

  it('returns error for rejected banned lecturer email', async () => {
    const user = await UserFactory(false, {
      isBlocked: true,
      role: UserRoleEnum.LECTURER
    });
    await LecturerFactory({
      userId: user.id,
      status: ApprovalStatusEnum.REJECTED
    });

    const { input } = await generateData({
      overrideInput: { email: user.email }
    });

    const { body } = await post(REGISTER, { input });

    expect(body.data.response.code).toBe(
      ErrorCodeEnum.CANNOT_RESUBMIT_BANNED_EMAIL
    );
  });
});
