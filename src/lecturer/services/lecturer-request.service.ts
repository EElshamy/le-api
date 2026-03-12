import { Inject, Injectable } from '@nestjs/common';
import { Includeable, Op } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { Sequelize } from 'sequelize-typescript';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { PaginatorInput } from '../../_common/paginator/paginator.input';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import { FieldOfTraining } from '../../field-of-training/field-of-training.model';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/services/user.service';
import {
  ApprovalStatusEnum,
  LecturersRequestsBoardSortEnum,
  ReplyLecturerRequestStatusEnum
} from '../enums/lecturer.enum';
import {
  LecturerRequestsBoardFilter,
  LecturerRequestsBoardSort
} from '../inputs/lecturer-requests-board.input';
import { ReplyLecturerJoinRequestInput } from '../inputs/reply-lecturer-request.input';
import { UpdateLecturerRequestBoardInput } from '../inputs/update-lecturer-request.input';
import { YearsOfExperienceRange } from '../interfaces/lecturer.type';
import { Lecturer } from '../models/lecturer.model';
import { LecturerRequest } from '../models/lecturer.request.model';
import { LecturerTransformer } from '../transformers/lecturer.transformer';
import { LecturerService } from './lecturer.service';
import { DeletedLecturerRequestsLog } from '../models/deleted-lecturer-requests-log.model';
import { NotificationService } from '@src/notification/notification.service';
import { SiteNotificationsTypeEnum } from '@src/notification/notification.enum';

@Injectable()
export class LecturerRequestService {
  constructor(
    @Inject(Repositories.LecturerRequestsRepository)
    private readonly lecturerRequestRepo: IRepository<LecturerRequest>,
    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    @Inject(Repositories.DeletedLecturerRequestsLogsRepository)
    private readonly deletedLecturerRequestLogsRepo: IRepository<DeletedLecturerRequestsLog>,
    private readonly lecturerService: LecturerService,
    private readonly userService: UserService,
    private readonly lecturerTransformer: LecturerTransformer,
    private readonly siteNotificationsService: NotificationService
  ) {}

  async lecturerRequestsBoard(
    paginate: PaginatorInput = {},
    filter: LecturerRequestsBoardFilter = {},
    sort: LecturerRequestsBoardSort = {
      sortType: SortTypeEnum.DESC,
      sortBy: LecturersRequestsBoardSortEnum.CREATED_AT
    }
  ) {
    return await this.lecturerRequestRepo.findPaginated(
      ...this.lecturerTransformer.lecturerRequestsBoardTransformer(
        paginate,
        filter,
        sort
      )
    );
  }

  async lecturerRequestOrError(
    lecturerRequestId: string,
    include: Includeable[] = []
  ) {
    const lecturerRequest = await this.lecturerRequestRepo.findOne(
      { id: lecturerRequestId },
      include
    );

    if (!lecturerRequest)
      throw new BaseHttpException(
        ErrorCodeEnum.LECTURER_REQUEST_DOES_NOT_EXIST
      );
    return lecturerRequest;
  }

  async lecturerRequestByLecturerCode(lecturerCode: string) {
    const lecturerRequest = await this.lecturerRequestRepo.findOne({}, [
      {
        model: Lecturer,
        required: true,
        attributes: [],
        include: [
          {
            model: User,
            required: true,
            where: { code: lecturerCode },
            attributes: []
          }
        ]
      }
    ]);

    if (!lecturerRequest)
      throw new BaseHttpException(
        ErrorCodeEnum.LECTURER_REQUEST_DOES_NOT_EXIST
      );
    return lecturerRequest;
  }

  async replyLecturerJoinRequest(input: ReplyLecturerJoinRequestInput) {
    const lecturerRequest = await this.lecturerRequestOrError(
      input.lecturerRequestId,
      [
        {
          model: Lecturer,
          required: true,
          include: [
            {
              model: User,
              required: true,
              where: { email: { [Op.ne]: null } }
            },
            FieldOfTraining
          ]
        }
      ]
    );

    if (!lecturerRequest.lecturer.jobTitleId)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_JOB_TITLE_IS_NOT_SET);

    if (!lecturerRequest?.lecturer?.fieldOfTrainings?.length)
      throw new BaseHttpException(ErrorCodeEnum.FIELD_OF_TRAINING_IS_NOT_SET);

    this.errorIfRequestIsAlreadyApproved(lecturerRequest);

    if (lecturerRequest.lecturer.user.isBlocked)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_BLOCKED);

    let tempToken;
    await this.sequelize.transaction(async transaction => {
      await this.lecturerRequestRepo.updateOneFromExistingModel(
        lecturerRequest,
        {
          ...(input.status === ReplyLecturerRequestStatusEnum.REJECTED ?
            input.rejectionInput
          : { rejectReason: null }),
          statusChangedAt: new Date(),
          status: ApprovalStatusEnum[input.status]
        },
        transaction
      );

      await this.lecturerRepo.updateOneFromExistingModel(
        lecturerRequest.lecturer,
        {
          ...(input.status === ReplyLecturerRequestStatusEnum.APPROVED &&
            input.acceptanceInput),
          status: ApprovalStatusEnum[input.status]
        },
        transaction
      );

      if (input.status === ReplyLecturerRequestStatusEnum.APPROVED) {
        tempToken =
          await this.lecturerService.generateLecturerPasswordResetToken(
            lecturerRequest.lecturer.userId
          );
      }
    });

    // send email
    await this.lecturerService.sendLecturerEmailByStatus(
      lecturerRequest.status,
      lecturerRequest.lecturer.user.email,
      lecturerRequest.lecturer.user.enFullName.split(' ')[0],
      lecturerRequest.rejectReason
    );
    // send notification
    if (input.status === ReplyLecturerRequestStatusEnum.APPROVED) {
      await this.siteNotificationsService.createSiteNotification(
        SiteNotificationsTypeEnum.LECTURER_APPROVAL,
        {
          userId: lecturerRequest.lecturer.userId
        }
      );
    }
    return lecturerRequest;
  }

  async deleteLecturerRequest(lecturerId: string) {
    const lecturerRequest = await this.lecturerRequestRepo.findOne(
      {
        lecturerId
      },
      [
        {
          model: Lecturer,
          required: true,
          include: [
            {
              model: User,
              required: true
            }
          ]
        }
      ]
    );

    if (!lecturerRequest)
      throw new BaseHttpException(
        ErrorCodeEnum.LECTURER_REQUEST_DOES_NOT_EXIST
      );
    return await this.sequelize.transaction(async transaction => {
      await this.deletedLecturerRequestLogsRepo.createOne(
        {
          lecturerRequestId: lecturerRequest.id,
          lecturerId: lecturerRequest?.lecturer?.id,
          userId: lecturerRequest?.lecturer?.user?.id,
          phoneNumber: lecturerRequest?.lecturer?.user?.phone,
          role: lecturerRequest?.lecturer?.user?.role,
          email: lecturerRequest?.lecturer?.user?.email
        },
        transaction
      );
      await this.lecturerRepo.deleteAll(
        { id: lecturerRequest?.lecturer?.id },
        transaction
      );
      await this.usersRepo.deleteAll(
        { id: lecturerRequest?.lecturer?.user?.id },
        transaction
      );
      return await this.lecturerRequestRepo.deleteAll(
        { id: lecturerRequest.id },
        transaction
      );
    });
  }
  private errorIfRequestIsAlreadyApproved(lecturerRequest: LecturerRequest) {
    if (lecturerRequest.status === ApprovalStatusEnum.APPROVED)
      throw new BaseHttpException(ErrorCodeEnum.REQUEST_ALREADY_RESOLVED);
  }

  async updateLecturerRequest(input: UpdateLecturerRequestBoardInput) {
    const lecturerRequest = await this.lecturerRequestOrError(
      input.lecturerRequestId,
      [Lecturer]
    );

    await this.userService.validateIfOtherUserHasEmailOrPhoneAndDeleteDuplicates(
      input.email,
      input.phone,
      lecturerRequest.lecturer.userId
    );

    if (lecturerRequest.status === ApprovalStatusEnum.APPROVED)
      throw new BaseHttpException(ErrorCodeEnum.CANNOT_EDIT_REQUEST);

    await this.sequelize.transaction(async transaction => {
      await this.lecturerService.validateJobTitleAndFieldofTraining(
        lecturerRequest.lecturer,
        input.jobTitleId,
        input.fieldOfTrainingIds,
        transaction
      );
      await this.lecturerRepo.updateOneFromExistingModel(
        lecturerRequest.lecturer,
        { ...input },
        transaction
      );
      await this.usersRepo.updateOne(
        { id: lecturerRequest.lecturer.userId },
        { ...input },
        transaction
      );

      if (input.cvUrl && input.cvUrl !== lecturerRequest.lecturer.cvUrl) {
        await this.lecturerService.setLecturerUploadedFilesReferences(
          lecturerRequest.lecturer,
          transaction
        );
      }

      return lecturerRequest;
    });
  }

  async findLecturersYearsOfExperience(): Promise<YearsOfExperienceRange[]> {
    const yearsOfExperience = await this.lecturerRepo.findAll(
      { status: ApprovalStatusEnum.PENDING },
      [],
      'yearsOfExperience',
      ['yearsOfExperience'],
      'yearsOfExperience'
    );
    return this.groupNumbersIntoRanges(
      yearsOfExperience.map(year => year.yearsOfExperience)
    );
  }

  private groupNumbersIntoRanges(numbers) {
    const ranges = Array.from({ length: 10 }, (_, i) => ({
      start: i * 5,
      end: (i + 1) * 5,
      label: `${i * 5}-${(i + 1) * 5}`
    }));
    const result: YearsOfExperienceRange[] = [];

    for (const range of ranges) {
      const rangeNumbers = numbers.filter(
        number => number >= range.start && number < range.end
      );
      if (
        rangeNumbers.length > 0 &&
        !result.some(r => r.start === range.start && r.end === range.end)
      ) {
        result.push(range);
      }
    }

    return result;
  }
}
