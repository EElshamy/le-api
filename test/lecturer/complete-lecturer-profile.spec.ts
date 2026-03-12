import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { ApprovalStatusEnum } from '../../src/lecturer/enums/lecturer.enum';
import { LecturerFactory } from '../../src/lecturer/factories/lecturer.factory';
import { CompleteLecturerProfileInput } from '../../src/lecturer/inputs/complete-lecturer-profile.input';
import { Lecturer } from '../../src/lecturer/models/lecturer.model';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import { UserRoleEnum } from '../../src/user/user.enum';
import { rollbackDbForAuth } from '../auth/rollback-for-auth';
import { COMPLETE_LECTURER_PROFILE } from '../graphql/lecturer';
import { post } from '../request';

interface CompleteLecturerProfileGenerateData {
  overrideInput?: Partial<CompleteLecturerProfileInput>;
  overrideUser?: Partial<User>;
  overrideLecturer?: Partial<Lecturer>;
}

async function generateCompleteLecturerProfileData(
  overrideData: CompleteLecturerProfileGenerateData = {}
) {
  const user = (await UserFactory(
    false,
    {
      role: UserRoleEnum.LECTURER,
      ...overrideData.overrideUser
    },
    true
  )) as User;
  const lecturer = await LecturerFactory(
    {
      ...overrideData.overrideLecturer,
      userId: user.id,
      hasCompletedProfile: false
    },
    false
  );

  const input: CompleteLecturerProfileInput = {
    bankAccountNumber: lecturer.bankAccountNumber,
    bankIBAN: lecturer?.bankIBAN,
    bankName: lecturer?.bankName,
    preferredPaymentMethod: lecturer.preferredPaymentMethod,
    vodafoneCashNumber: lecturer.vodafoneCashNumber,
    enBio: lecturer.enBio,
    arBio: lecturer.arBio,
    profilePicture: user.profilePicture,
    ...overrideData.overrideInput
  };
  return { input, user };
}

describe('complete Lecture profile suite', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('return error if unauthorized', async () => {
    const { input } = await generateCompleteLecturerProfileData();
    const { body } = await post(COMPLETE_LECTURER_PROFILE, { input });
    expect(body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return error if not approved yet', async () => {
    const { input, user } = await generateCompleteLecturerProfileData({
      overrideLecturer: { status: ApprovalStatusEnum.REJECTED }
    });
    const { body } = await post(
      COMPLETE_LECTURER_PROFILE,
      { input },
      user.token
    );
    expect(body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('completes profile successfully', async () => {
    const { input, user } = await generateCompleteLecturerProfileData();
    const { body } = await post(
      COMPLETE_LECTURER_PROFILE,
      { input },
      user.token
    );
    expect(body.data.response.code).toBe(200);
  });
});
