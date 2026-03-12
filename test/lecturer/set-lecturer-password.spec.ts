import { ConfigService } from '@nestjs/config';
import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { HelperService } from '../../src/_common/utils/helper.service';
import { ApprovalStatusEnum } from '../../src/lecturer/enums/lecturer.enum';
import { LecturerFactory } from '../../src/lecturer/factories/lecturer.factory';
import { SetLecturerPasswordInput } from '../../src/lecturer/inputs/set-lecturer-password.input';
import { Lecturer } from '../../src/lecturer/models/lecturer.model';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import { UserRoleEnum } from '../../src/user/user.enum';
import { rollbackDbForAuth } from '../auth/rollback-for-auth';
import { VALID_PASSWORD } from '../constants';
import { RESET_LECTURER_PASSWORD } from '../graphql/lecturer';
import { post } from '../request';

interface SetLecturerPasswordGenerateData {
  overrideInput?: Partial<SetLecturerPasswordInput>;
  overrideUser?: Partial<User>;
  overrideLecturer?: Partial<Lecturer>;
}
//FIXME: use nest mockinggg
const config = new ConfigService();
const helper = new HelperService(config);

const userRepo = new (buildRepository(User))() as IRepository<User>;

async function generateSetLecturerPasswordData(
  overrideData: SetLecturerPasswordGenerateData = {}
) {
  const user = (await UserFactory(
    false,
    {
      role: UserRoleEnum.LECTURER,
      password: null,
      ...overrideData.overrideUser
    },
    false,
    true
  )) as User;
  await LecturerFactory(
    { ...overrideData.overrideLecturer, userId: user.id },
    false
  );

  const input: SetLecturerPasswordInput = {
    password: VALID_PASSWORD,
    ...overrideData.overrideInput
  };
  return { input, user };
}

describe('set lecturer password after acceptance', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('return error if unauthorized', async () => {
    const { input } = await generateSetLecturerPasswordData();
    const { body } = await post(RESET_LECTURER_PASSWORD, { input });
    expect(body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return error if password is already set', async () => {
    const { input, user } = await generateSetLecturerPasswordData({
      overrideUser: { password: VALID_PASSWORD }
    });

    const { body } = await post(RESET_LECTURER_PASSWORD, { input }, user.token);
    expect(body.data.response.code).toBe(
      ErrorCodeEnum.LECTURER_PASSWORD_ALREADY_SET
    );
  });

  it('return error if invalid token', async () => {
    const { input, user } = await generateSetLecturerPasswordData();

    const token = helper.generateAuthToken({
      userId: user.id,
      sessionId: 'randomTexttt',
      expiresIn: '24h'
    });

    const { body } = await post(RESET_LECTURER_PASSWORD, { input }, token);
    expect(body.data.response.code).toBe(
      ErrorCodeEnum.PASSWORD_RESET_LINK_EXPIRED
    );
  });

  it('return error if token expired', async () => {
    const { input, user } = await generateSetLecturerPasswordData();

    const token = helper.generateAuthToken({
      userId: user.id,
      sessionId: user.passwordResetSessionId,
      expiresIn: '1'
    });

    const { body } = await post(RESET_LECTURER_PASSWORD, { input }, token);
    expect(body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return error if lecturer is rejected', async () => {
    const { input, user } = await generateSetLecturerPasswordData({
      overrideLecturer: { status: ApprovalStatusEnum.REJECTED }
    });

    const { body } = await post(RESET_LECTURER_PASSWORD, { input }, user.token);
    expect(body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('set password successfully', async () => {
    const { input, user } = await generateSetLecturerPasswordData({});
    const { body } = await post(RESET_LECTURER_PASSWORD, { input }, user.token);
    expect(body.data.response.code).toBe(200);
    const userAfterUpdate = await userRepo.findOne({ id: user.id });
    expect(userAfterUpdate.password).not.toBeNull();
  });
});
