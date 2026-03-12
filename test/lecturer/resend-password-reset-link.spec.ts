import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { ApprovalStatusEnum } from '../../src/lecturer/enums/lecturer.enum';
import { LecturerFactory } from '../../src/lecturer/factories/lecturer.factory';
import { LecturerUserIdInput } from '../../src/lecturer/inputs/lecturer-userId.input';
import { Lecturer } from '../../src/lecturer/models/lecturer.model';
import { AdminFactory } from '../../src/user/factories/admin.factory';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import { UserRoleEnum } from '../../src/user/user.enum';
import { rollbackDbForAuth } from '../auth/rollback-for-auth';
import { VALID_PASSWORD } from '../constants';
import { RESNED_LECTURER_PASSWORD_RESET } from '../graphql/lecturer';
import { post } from '../request';

interface ResendPasswordResetLinkGenerateData {
  overrideUser?: Partial<User>;
  overrideLecturer?: Partial<Lecturer>;
  overrideSecurityGroupPermission?: string[];
}

const userRepo = new (buildRepository(User))() as IRepository<User>;

async function generateResendPasswordResetLinkData(
  overrideData: ResendPasswordResetLinkGenerateData = {}
) {
  const user = (await UserFactory(
    false,
    {
      role: UserRoleEnum.LECTURER,
      password: null,
      ...overrideData.overrideUser
    },
    false
  )) as User;
  await LecturerFactory(
    { ...overrideData.overrideLecturer, userId: user.id },
    false
  );
  const admin = await AdminFactory(
    overrideData.overrideSecurityGroupPermission
  );

  const input: LecturerUserIdInput = {
    userIdOfLecturer: user.id
  };
  return { input, user, admin };
}

describe('set lecturer password after acceptance', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('return error if unauthorized', async () => {
    const { input } = await generateResendPasswordResetLinkData();
    const { body } = await post(RESNED_LECTURER_PASSWORD_RESET, { ...input });

    expect(body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return error if password is already set', async () => {
    const { input, admin } = await generateResendPasswordResetLinkData({
      overrideUser: { password: VALID_PASSWORD }
    });

    const { body } = await post(
      RESNED_LECTURER_PASSWORD_RESET,
      { ...input },
      admin.token
    );
    expect(body.data.response.code).toBe(
      ErrorCodeEnum.LECTURER_PASSWORD_ALREADY_SET
    );
  });

  it('return error if lecturer is not yet approved', async () => {
    const { input, admin } = await generateResendPasswordResetLinkData({
      overrideLecturer: { status: ApprovalStatusEnum.REJECTED }
    });

    const { body } = await post(
      RESNED_LECTURER_PASSWORD_RESET,
      { ...input },
      admin.token
    );
    expect(body.data.response.code).toBe(ErrorCodeEnum.LECTURER_NOT_APPROVED);
  });

  it('successfully resends password reset link', async () => {
    const { input, admin, user } = await generateResendPasswordResetLinkData(
      {}
    );

    const { body } = await post(
      RESNED_LECTURER_PASSWORD_RESET,
      { ...input },
      admin.token
    );
    expect(body.data.response.code).toBe(200);

    const userAfterResend = await userRepo.findOne({ id: user.id });
    expect(userAfterResend.passwordResetSessionId).not.toBe(
      user.passwordResetSessionId
    );
  });
});
