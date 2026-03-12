import { log } from 'node:console';
import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { FieldOfTrainingFactory } from '../../src/field-of-training/field-of-training.factory';
import { ApprovalStatusEnum } from '../../src/lecturer/enums/lecturer.enum';
import { LecturerFactory } from '../../src/lecturer/factories/lecturer.factory';
import { CreateLecturerBoardInput } from '../../src/lecturer/inputs/create-lecturer-board.input';
import { LecturerFieldOfTraining } from '../../src/lecturer/models/lecturer-field-of-training.model';
import { Lecturer } from '../../src/lecturer/models/lecturer.model';
import { AdminFactory } from '../../src/user/factories/admin.factory';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import { UserRoleEnum } from '../../src/user/user.enum';
import { rollbackDbForAuth } from '../auth/rollback-for-auth';
import { CREATE_LECTURER_BOARD } from '../graphql/lecturer';
import { post } from '../request';

interface CreateLecturerBoardGenerateData {
  overrideInput?: Partial<CreateLecturerBoardInput>;
  overrideUser?: Partial<User>;
  overrideLecturer?: Partial<Lecturer>;
  overrideSecurityGroupPermission?: string[];
}
const lecturerFieldOfTrainingRepo = new (buildRepository(
  LecturerFieldOfTraining
))() as IRepository<LecturerFieldOfTraining>;

async function generateCreateLecturerBoardData(
  overrideData: CreateLecturerBoardGenerateData = {}
) {
  const user = (await UserFactory(true, {
    role: UserRoleEnum.LECTURER,
    ...overrideData.overrideUser
  })) as User;

  const lecturer = await LecturerFactory(
    {
      ...overrideData.overrideLecturer,
      userId: user.id,
      hasCompletedProfile: false
    },
    true
  );
  const admin = await AdminFactory(
    overrideData.overrideSecurityGroupPermission
  );

  const fieldOfTraining = await FieldOfTrainingFactory();
  const input: CreateLecturerBoardInput = <CreateLecturerBoardInput>(<unknown>{
    arFullName: user.arFullName,
    enFullName: user.enFullName,
    email: user.email,
    phone: user.phone,
    nationality: user.nationality,
    country: user.country,
    jobTitleId: lecturer.jobTitleId,
    yearsOfExperience: lecturer.yearsOfExperience,
    linkedInUrl: lecturer.linkedInUrl,
    facebookUrl: lecturer.facebookUrl,
    fieldOfTrainingIds: [fieldOfTraining.id],
    bankAccountNumber: lecturer.bankAccountNumber,
    bankIBAN: lecturer.bankIBAN,
    preferredPaymentMethod: lecturer.preferredPaymentMethod,
    vodafoneCashNumber: lecturer.vodafoneCashNumber,
    enBio: lecturer.enBio,
    arBio: lecturer.arBio,
    profilePicture: user.profilePicture,
    uploadedMaterialUrl: lecturer.uploadedMaterialUrl,
    commissionPercentage: lecturer.commissionPercentage,
    ...overrideData.overrideInput
  });
  return { input, user, admin };
}

describe('create lecturer board', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('returns error if unauthorized', async () => {
    const { input } = await generateCreateLecturerBoardData();

    const { body } = await post(CREATE_LECTURER_BOARD, { input });
    log(body);
    expect(body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('returns error for wrong permission', async () => {
    const { input, admin } = await generateCreateLecturerBoardData({
      overrideSecurityGroupPermission: []
    });

    const { body } = await post(CREATE_LECTURER_BOARD, { input }, admin.token);

    expect(body.data.response.code).toBe(ErrorCodeEnum.PERMISSION_DENIED);
  });

  it('returns error if email already exists', async () => {
    const user = await UserFactory();

    const { input, admin } = await generateCreateLecturerBoardData({
      overrideUser: { email: user.email }
    });

    const { body } = await post(CREATE_LECTURER_BOARD, { input }, admin.token);

    expect(body.data.response.code).toBe(ErrorCodeEnum.EMAIL_ALREADY_EXISTS);
  });

  it('returns error if phone already exists', async () => {
    const user = await UserFactory();

    const { input, admin } = await generateCreateLecturerBoardData({
      overrideUser: { phone: user.phone }
    });

    const { body } = await post(CREATE_LECTURER_BOARD, { input }, admin.token);

    expect(body.data.response.code).toBe(ErrorCodeEnum.PHONE_ALREADY_EXISTS);
  });

  it('create lecturer successfully', async () => {
    const { input, admin } = await generateCreateLecturerBoardData();

    const { body } = await post(CREATE_LECTURER_BOARD, { input }, admin.token);

    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data.lecturer.status).toBe(
      ApprovalStatusEnum.APPROVED
    );
    expect(body.data.response.data.code).not.toBeNull();
    expect(body.data.response.data.lecturer.hasCompletedProfile).toBeTruthy();

    const fieldOfTraining = await lecturerFieldOfTrainingRepo.findAll();
    expect(fieldOfTraining.length).toBe(input.fieldOfTrainingIds.length);
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

    const { input, admin } = await generateCreateLecturerBoardData({
      overrideInput: { email: user.email }
    });

    const { body } = await post(CREATE_LECTURER_BOARD, { input }, admin.token);

    expect(body.data.response.code).toBe(200);
  });

  it('returns success for rejected lecturer phone', async () => {
    const user = await UserFactory(false, {
      isBlocked: false,
      role: UserRoleEnum.LECTURER
    });
    await LecturerFactory({
      userId: user.id,
      status: ApprovalStatusEnum.REJECTED
    });

    const { input, admin } = await generateCreateLecturerBoardData({
      overrideInput: { phone: user.phone }
    });

    const { body } = await post(CREATE_LECTURER_BOARD, { input }, admin.token);

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

    const { input, admin } = await generateCreateLecturerBoardData({
      overrideInput: { email: user.email }
    });

    const { body } = await post(CREATE_LECTURER_BOARD, { input }, admin.token);

    expect(body.data.response.code).toBe(
      ErrorCodeEnum.CANNOT_RESUBMIT_BANNED_EMAIL
    );
  });

  it('returns error for rejected banned lecturer phone', async () => {
    const user = await UserFactory(false, {
      isBlocked: true,
      role: UserRoleEnum.LECTURER
    });
    await LecturerFactory({
      userId: user.id,
      status: ApprovalStatusEnum.REJECTED
    });

    const { input, admin } = await generateCreateLecturerBoardData({
      overrideInput: { phone: user.phone }
    });

    const { body } = await post(CREATE_LECTURER_BOARD, { input }, admin.token);

    expect(body.data.response.code).toBe(
      ErrorCodeEnum.CANNOT_RESUBMIT_BANNED_PHONE
    );
  });
});
