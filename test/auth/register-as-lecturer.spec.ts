import { faker } from '@faker-js/faker';
import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { RegisterAsLecturerInput } from '../../src/auth/inputs/register-as-lecturer.input';
import { FieldOfTrainingFactory } from '../../src/field-of-training/field-of-training.factory';
import { JobTitleFactory } from '../../src/job-title/job-title.factory';
import { ApprovalStatusEnum } from '../../src/lecturer/enums/lecturer.enum';
import { LecturerFactory } from '../../src/lecturer/factories/lecturer.factory';
import { LecturerFieldOfTraining } from '../../src/lecturer/models/lecturer-field-of-training.model';
import { Lecturer } from '../../src/lecturer/models/lecturer.model';
import { LecturerRequest } from '../../src/lecturer/models/lecturer.request.model';
import { ActionTypeEnum } from '../../src/user-sessions/user-sessions.enum';
import { UserSession } from '../../src/user-sessions/user-sessions.model';
import { UserVerificationCode } from '../../src/user-verification-code/user-verification-code.model';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import {
  DeviceEnum,
  UserRoleEnum,
  UserVerificationCodeUseCaseEnum
} from '../../src/user/user.enum';
import { REGISTER_AS_LECTURER } from '../graphql/auth';
import { post } from '../request';
import { rollbackDbForAuth } from './rollback-for-auth';

interface RegisterAsLecturerGenerateData {
  overrideInput?: Partial<RegisterAsLecturerInput>;
  overrideUser?: Partial<User>;
  overrideLecturer?: Partial<Lecturer>;
}
const lecturerRequestRepo = new (buildRepository(
  LecturerRequest
))() as IRepository<LecturerRequest>;

const lecturerFieldOfTrainingRepo = new (buildRepository(
  LecturerFieldOfTraining
))() as IRepository<LecturerFieldOfTraining>;

const verificationCodeRepo = new (buildRepository(
  UserVerificationCode
))() as IRepository<UserVerificationCode>;

const userSessionRepo = new (buildRepository(
  UserSession
))() as IRepository<UserSession>;

async function generateData(overrideData: RegisterAsLecturerGenerateData = {}) {
  const user = (await UserFactory(true, {
    role: UserRoleEnum.LECTURER,
    email: null,
    password: null,
    ...overrideData.overrideUser
  })) as User;
  const lecturer = await LecturerFactory(
    { ...overrideData.overrideLecturer },
    true
  );
  const fieldOfTraining = await FieldOfTrainingFactory();

  const input: RegisterAsLecturerInput = <RegisterAsLecturerInput>(<unknown>{
    arFullName: user.arFullName,
    enFullName: user.enFullName,
    email: user.unverifiedEmail,
    phone: user.phone,
    nationality: user.nationality,
    country: user.country,
    jobTitleId: lecturer.jobTitleId,
    yearsOfExperience: lecturer.yearsOfExperience,
    cvUrl: lecturer.cvUrl,
    linkedInUrl: lecturer.linkedInUrl,
    facebookUrl: lecturer.facebookUrl,
    fieldOfTrainingIds: [fieldOfTraining.id],
    loginDetails: {
      device: <DeviceEnum>(
        (<unknown>faker.helpers.arrayElement(Object.keys(DeviceEnum)))
      ),
      deviceName: faker.word.words()
    },
    ...overrideData.overrideInput
  });
  return { input, user };
}

describe('Register as a lecturer ', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('register as lecturer successfully', async () => {
    const { input } = await generateData();
    const { body } = await post(REGISTER_AS_LECTURER, { input });

    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data.unverifiedEmail).toBe(
      input.email.toLowerCase()
    );
    expect(body.data.response.data.email).toBeNull();
    expect(body.data.response.data.token).toBeNull();
    expect(body.data.response.data.code).toBeNull();
    expect(body.data.response.data.hasPassword).toBeFalsy();
    expect(body.data.response.data.lecturer.hasCompletedProfile).toBeFalsy();
    expect(body.data.response.data.lecturer.status).toBe(
      ApprovalStatusEnum.PENDING
    );

    const lecturerRequest = await lecturerRequestRepo.findAll();
    expect(lecturerRequest.length).toBe(1);
    expect(lecturerRequest[0].lecturerId).toBe(
      body.data.response.data.lecturer.id
    );

    const fieldOfTraining = await lecturerFieldOfTrainingRepo.findAll();
    expect(fieldOfTraining.length).toBe(input.fieldOfTrainingIds.length);
  });

  it('returns error when register with inactive job title', async () => {
    const jobTitle = await JobTitleFactory({ isActive: false });
    const { input } = await generateData({
      overrideInput: { jobTitleId: jobTitle.id }
    });
    const { body } = await post(REGISTER_AS_LECTURER, { input });
    expect(body.data.response.code).toBe(ErrorCodeEnum.JOB_TITLE_IS_NOT_ACTIVE);
  });

  it('returns error when register with inactive field of training', async () => {
    const fieldOfTraining = await FieldOfTrainingFactory({ isActive: false });
    const { input } = await generateData({
      overrideInput: { fieldOfTrainingIds: [fieldOfTraining.id] }
    });
    const { body } = await post(REGISTER_AS_LECTURER, { input });
    expect(body.data.response.code).toBe(
      ErrorCodeEnum.FIELD_OF_TRAINING_DOES_NOT_EXIST
    );
  });

  it('register successfully with rejected user email', async () => {
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
    const { body } = await post(REGISTER_AS_LECTURER, { input });
    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data.lecturer.status).toBe(
      ApprovalStatusEnum.PENDING
    );
  });

  it('throws error when trying to register with rejected blocked user email', async () => {
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
    const { body } = await post(REGISTER_AS_LECTURER, { input });
    expect(body.data.response.code).toBe(
      ErrorCodeEnum.CANNOT_RESUBMIT_BANNED_EMAIL
    );
  });

  it('register successfully with rejected user phone', async () => {
    const user = await UserFactory(false, {
      isBlocked: false,
      role: UserRoleEnum.LECTURER
    });
    await LecturerFactory({
      userId: user.id,
      status: ApprovalStatusEnum.REJECTED
    });

    const { input } = await generateData({
      overrideInput: { phone: user.phone }
    });
    const { body } = await post(REGISTER_AS_LECTURER, { input });
    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data.lecturer.status).toBe(
      ApprovalStatusEnum.PENDING
    );
  });

  it('throws error when trying to register with rejected blocked user phone', async () => {
    const user = await UserFactory(false, {
      isBlocked: true,
      role: UserRoleEnum.LECTURER
    });
    await LecturerFactory({
      userId: user.id,
      status: ApprovalStatusEnum.REJECTED
    });

    const { input } = await generateData({
      overrideInput: { phone: user.phone }
    });
    const { body } = await post(REGISTER_AS_LECTURER, { input });
    expect(body.data.response.code).toBe(
      ErrorCodeEnum.CANNOT_RESUBMIT_BANNED_PHONE
    );
  });

  it('creates verification code after successfully registering', async () => {
    const { input } = await generateData();
    const { body } = await post(REGISTER_AS_LECTURER, { input });
    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data.unverifiedEmail).toBe(
      input.email.toLowerCase()
    );

    const verificationCode = await verificationCodeRepo.findAll();
    expect(verificationCode.length).toBe(1);
    expect(verificationCode[0].useCase).toBe(
      UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION
    );
    expect(verificationCode[0].userId).toBe(body.data.response.data.id);
  });

  it('creates inactive user session after successfully registering', async () => {
    const { input } = await generateData();
    const { body } = await post(REGISTER_AS_LECTURER, { input });
    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data.unverifiedEmail).toBe(
      input.email.toLowerCase()
    );

    const userSession = await userSessionRepo.findAll();
    expect(userSession.length).toBe(1);
    expect(userSession[0].actionType).toBe(ActionTypeEnum.SIGN_UP);
    expect(userSession[0].userId).toBe(body.data.response.data.id);
  });

  it('throws error when trying to register with an existing email', async () => {
    const user = await UserFactory(false, { role: UserRoleEnum.LECTURER });
    const { input } = await generateData({
      overrideInput: { email: user.email }
    });
    const { body } = await post(REGISTER_AS_LECTURER, { input });
    expect(body.data.response.code).toBe(ErrorCodeEnum.EMAIL_ALREADY_EXISTS);
  });

  it('throws error when trying to register with an existing phone', async () => {
    const user = await UserFactory();
    const { input } = await generateData({
      overrideInput: { phone: user.phone }
    });
    const { body } = await post(REGISTER_AS_LECTURER, { input });
    expect(body.data.response.code).toBe(ErrorCodeEnum.PHONE_ALREADY_EXISTS);
  });
});
