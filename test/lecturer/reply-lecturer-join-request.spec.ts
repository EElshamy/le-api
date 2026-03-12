import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import {
  ApprovalStatusEnum,
  ReplyLecturerRequestStatusEnum
} from '../../src/lecturer/enums/lecturer.enum';
import { generateReplyLecturerJoinRequestData } from '../../src/lecturer/factories/lecturer-request.factory';
import { LecturerRequestPermissionsEnum } from '../../src/security-group/security-group-permissions';
import { AdminFactory } from '../../src/user/factories/admin.factory';
import { User } from '../../src/user/models/user.model';
import { rollbackDbForAuth } from '../auth/rollback-for-auth';
import { REPLY_LECTURER_JOIN_REQUEST } from '../graphql/lecturer';
import { post } from '../request';

const userRepo = new (buildRepository(User))() as IRepository<User>;

describe('Reply Lecturer join request suite', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('returns error if unauthorized', async () => {
    const { input } = await generateReplyLecturerJoinRequestData({
      overrideInput: {
        status: ReplyLecturerRequestStatusEnum.APPROVED,
        rejectionInput: null
      }
    });
    const { body } = await post(REPLY_LECTURER_JOIN_REQUEST, { input });

    expect(body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('returns error if wrong admin permission', async () => {
    const { input } = await generateReplyLecturerJoinRequestData({
      overrideInput: {
        status: ReplyLecturerRequestStatusEnum.APPROVED,
        rejectionInput: null
      }
    });

    const admin = await AdminFactory([
      LecturerRequestPermissionsEnum.READ_LECTURER_REQUEST
    ]);

    const { body } = await post(
      REPLY_LECTURER_JOIN_REQUEST,
      { input },
      admin.token
    );

    expect(body.data.response.code).toBe(ErrorCodeEnum.PERMISSION_DENIED);
  });

  it('accepts pending request successfully', async () => {
    const { input, user } = await generateReplyLecturerJoinRequestData({
      overrideInput: {
        status: ReplyLecturerRequestStatusEnum.APPROVED,
        rejectionInput: null
      }
    });

    const admin = await AdminFactory();
    const { body } = await post(
      REPLY_LECTURER_JOIN_REQUEST,
      { input },
      admin.token
    );

    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data.status).toBe(ApprovalStatusEnum.APPROVED);
    expect(body.data.response.data.statusChangedAt).not.toBeNull();
    expect(body.data.response.data.rejectReason).toBeNull();
    expect(body.data.response.data.user.lecturer.status).toBe(
      ApprovalStatusEnum.APPROVED
    );
    expect(body.data.response.data.user.lecturer.commissionPercentage).toBe(
      input.acceptanceInput.commissionPercentage
    );
    expect(body.data.response.data.user.lecturer.uploadedMaterialUrl).toBe(
      input.acceptanceInput.uploadedMaterialUrl
    );

    const userAfterUpdate = await userRepo.findOne({ id: user.id });

    expect(userAfterUpdate.passwordResetSessionId).not.toBeNull();
  });

  it('rejects pending request successfully', async () => {
    const { input, user } = await generateReplyLecturerJoinRequestData({
      overrideUser: { passwordResetSessionId: null },
      overrideLecturerRequest: { rejectReason: null },
      overrideInput: {
        status: ReplyLecturerRequestStatusEnum.REJECTED,
        acceptanceInput: null,
        rejectionInput: { rejectReason: 'lol' }
      }
    });

    const admin = await AdminFactory();
    const { body } = await post(
      REPLY_LECTURER_JOIN_REQUEST,
      { input },
      admin.token
    );

    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data.status).toBe(ApprovalStatusEnum.REJECTED);
    expect(body.data.response.data.statusChangedAt).not.toBeNull();
    expect(body.data.response.data.rejectReason).not.toBeNull();
    expect(body.data.response.data.user.lecturer.status).toBe(
      ApprovalStatusEnum.REJECTED
    );
    expect(
      body.data.response.data.user.lecturer.commissionPercentage
    ).toBeNull();
    expect(
      body.data.response.data.user.lecturer.uploadedMaterialUrl
    ).toBeNull();
    const userAfterUpdate = await userRepo.findOne({ id: user.id });
    expect(userAfterUpdate.passwordResetSessionId).toBeNull();
  });

  it('returns error if already approved', async () => {
    const { input } = await generateReplyLecturerJoinRequestData({
      overrideLecturerRequest: { status: ApprovalStatusEnum.APPROVED },
      overrideLecturer: { status: ApprovalStatusEnum.APPROVED },
      overrideInput: {
        status: ReplyLecturerRequestStatusEnum.APPROVED,
        rejectionInput: null
      }
    });

    const admin = await AdminFactory();
    const { body } = await post(
      REPLY_LECTURER_JOIN_REQUEST,
      { input },
      admin.token
    );
    expect(body.data.response.code).toBe(
      ErrorCodeEnum.REQUEST_ALREADY_RESOLVED
    );
  });

  it("returns error if lecturer doesn't have job title", async () => {
    const { input } = await generateReplyLecturerJoinRequestData({
      overrideLecturer: { jobTitleId: null }
    });

    const admin = await AdminFactory();
    const { body } = await post(
      REPLY_LECTURER_JOIN_REQUEST,
      { input },
      admin.token
    );
    expect(body.data.response.code).toBe(
      ErrorCodeEnum.LECTURER_JOB_TITLE_IS_NOT_SET
    );
  });

  it("returns error if lecturer doesn't have field of training", async () => {
    const { input } = await generateReplyLecturerJoinRequestData({
      overrideLecturer: { fieldOfTrainings: null }
    });

    const admin = await AdminFactory();
    const { body } = await post(
      REPLY_LECTURER_JOIN_REQUEST,
      { input },
      admin.token
    );
    expect(body.data.response.code).toBe(
      ErrorCodeEnum.FIELD_OF_TRAINING_IS_NOT_SET
    );
  });

  it('successfully accepts rejected request', async () => {
    const { input } = await generateReplyLecturerJoinRequestData({
      overrideLecturerRequest: { status: ApprovalStatusEnum.REJECTED },
      overrideLecturer: { status: ApprovalStatusEnum.REJECTED },
      overrideInput: {
        status: ReplyLecturerRequestStatusEnum.APPROVED,
        rejectionInput: null
      }
    });

    const admin = await AdminFactory();
    const { body } = await post(
      REPLY_LECTURER_JOIN_REQUEST,
      { input },
      admin.token
    );
    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data.status).toBe(ApprovalStatusEnum.APPROVED);
    expect(body.data.response.data.statusChangedAt).not.toBeNull();
    expect(body.data.response.data.rejectReason).toBeNull();
    expect(body.data.response.data.user.lecturer.status).toBe(
      ApprovalStatusEnum.APPROVED
    );
  });
});
