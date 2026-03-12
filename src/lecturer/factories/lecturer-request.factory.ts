import { faker } from '@faker-js/faker';
import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { UserFactory } from '../../user/factories/user.factory';
import { User } from '../../user/models/user.model';
import { UserRoleEnum } from '../../user/user.enum';
import {
  ApprovalStatusEnum,
  ReplyLecturerRequestStatusEnum
} from '../enums/lecturer.enum';
import { ReplyLecturerJoinRequestInput } from '../inputs/reply-lecturer-request.input';
import { Lecturer } from '../models/lecturer.model';
import { LecturerRequest } from '../models/lecturer.request.model';
import { LecturerFactory } from './lecturer.factory';

const lecturerRepo = new (buildRepository(
  LecturerRequest
))() as IRepository<LecturerRequest>;

async function buildParams(input = <any>{}): Promise<Partial<LecturerRequest>> {
  return {
    status: faker.helpers.arrayElement(Object.keys(ApprovalStatusEnum)),
    rejectReason: faker.lorem.words(),
    statusChangedAt: new Date(),
    ...input,
    lecturerId: input.lecturerId
  };
}

export const LecturerRequestsFactory = async (
  count: number = 10,
  input = <any>{}
): Promise<LecturerRequest[]> => {
  let lecturerRequests = [];
  for (let i = 0; i < count; i++) lecturerRequests.push(buildParams(input));
  return await lecturerRepo.bulkCreate(lecturerRequests);
};

export const LecturerRequestFactory = async (
  input = <any>{},
  returnInputOnly: boolean = false
): Promise<Partial<LecturerRequest>> => {
  const params = await buildParams(input);
  if (returnInputOnly) return params;
  return await lecturerRepo.createOne(params);
};

interface ReplyLecturerJoinRequestGenerateData {
  overrideInput?: Partial<ReplyLecturerJoinRequestInput>;
  overrideUser?: Partial<User>;
  overrideLecturer?: Partial<Lecturer>;
  overrideLecturerRequest?: Partial<LecturerRequest>;
}

export async function generateReplyLecturerJoinRequestData(
  overrideData: ReplyLecturerJoinRequestGenerateData = {}
) {
  const user = (await UserFactory(false, {
    role: UserRoleEnum.LECTURER,
    password: null,
    ...overrideData.overrideUser
  })) as User;
  const lecturer = await LecturerFactory(
    {
      ...overrideData.overrideLecturer,
      userId: user.id,
      commissionPercentage: null,
      uploadedMaterialUrl: null
    },
    false
  );
  const lecturerRequest = await LecturerRequestFactory({
    status: ApprovalStatusEnum.PENDING,
    ...overrideData.overrideLecturerRequest,
    lecturerId: lecturer.id
  });
  const status = (overrideData?.overrideInput?.status ||
    faker.helpers.arrayElement(
      Object.keys(ReplyLecturerRequestStatusEnum)
    )) as any;
  const input: ReplyLecturerJoinRequestInput = {
    lecturerRequestId: lecturerRequest.id,
    status,
    ...(status === ReplyLecturerRequestStatusEnum.APPROVED
      ? {
          acceptanceInput: {
            uploadedMaterialUrl: faker.internet.url(),
            commissionPercentage: Math.floor(Math.random() * 101)
          }
        }
      : {
          rejectionInput: { rejectReason: faker.lorem.words() }
        }),
    ...overrideData.overrideInput
  };
  return { input, user };
}
