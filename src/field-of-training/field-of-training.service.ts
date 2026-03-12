import { Inject } from '@nestjs/common';
import { Op, Order, Transaction, col, fn } from 'sequelize';
import { Repositories } from '../_common/database/database-repository.enum';
import { IRepository } from '../_common/database/repository.interface';
import { BaseHttpException } from '../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../_common/exceptions/error-code.enum';
import { PaginatorInput } from '../_common/paginator/paginator.input';
import { SortTypeEnum } from '../_common/paginator/paginator.types';
import { ApprovalStatusEnum } from '../lecturer/enums/lecturer.enum';
import { LecturerFieldOfTraining } from '../lecturer/models/lecturer-field-of-training.model';
import { Lecturer } from '../lecturer/models/lecturer.model';
import { FieldOfTrainingSortEnum } from './field-of-training.enum';
import { FieldOfTraining } from './field-of-training.model';
import { CreateFieldOfTrainingBoardInput } from './inputs/create-field-of-training.input';
import {
  FieldOfTrainingsBoardFilter,
  FieldOfTrainingsBoardSort
} from './inputs/field-of-training-board.input';
import { UpdateFieldOfTrainingBoardInput } from './inputs/update-field-of-training.input';

export class FieldOfTrainingService {
  constructor(
    @Inject(Repositories.FieldOfTrainingsRepository)
    private readonly fieldOfTrainingRepo: IRepository<FieldOfTraining>,
    @Inject(Repositories.LecturerFieldOfTrainingsRepository)
    private readonly lecturerFieldOfTrainingRepo: IRepository<LecturerFieldOfTraining>
  ) {}

  async createFieldOfTrainingBoard(
    input: CreateFieldOfTrainingBoardInput
  ): Promise<FieldOfTraining> {
    return await this.fieldOfTrainingRepo.createOne(input);
  }

  async updateFieldOfTrainingBoard(
    input: UpdateFieldOfTrainingBoardInput
  ): Promise<FieldOfTraining> {
    const fieldOfTraining = await this.fieldOfTrainingOrError(
      input.fieldOfTrainingId
    );
    return await this.fieldOfTrainingRepo.updateOneFromExistingModel(
      fieldOfTraining,
      input
    );
  }

  async fieldOfTrainingOrError(fieldOfTrainingId: string) {
    const fieldOfTraining = await this.fieldOfTrainingRepo.findOne({
      id: fieldOfTrainingId
    });
    if (!fieldOfTraining)
      throw new BaseHttpException(
        ErrorCodeEnum.FIELD_OF_TRAINING_DOES_NOT_EXIST
      );
    return fieldOfTraining;
  }

  async fieldOfTrainingsBoard(
    filter: FieldOfTrainingsBoardFilter = {},
    paginate: PaginatorInput = {},
    sort: FieldOfTrainingsBoardSort = {
      sortBy: FieldOfTrainingSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    }
  ) {
    return await this.fieldOfTrainingRepo.findPaginated(
      {
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.searchKey && {
          [Op.or]: [
            { arName: { [Op.iLike]: `%${filter.searchKey}%` } },
            { enName: { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        })
      },
      this.sortFieldOfTrainingsBoard(sort),
      paginate.page,
      paginate.limit,
      [
        {
          model: Lecturer,
          required: false,
          attributes: [],
          where: {
            status: [ApprovalStatusEnum.APPROVED, ApprovalStatusEnum.PENDING]
          },
          through: {
            attributes: []
          }
        }
      ],
      {
        include: [[fn('COUNT', col('"fieldOfTrainingId"')), 'timesUsed']]
      },
      false,
      false,
      ['"FieldOfTraining"."id"']
    );
  }

  private sortFieldOfTrainingsBoard(sort: FieldOfTrainingsBoardSort): Order {
    return [[sort.sortBy, sort.sortType]];
  }
  async fieldOfTrainings(paginate: PaginatorInput = {}, filter: any = {}) {
    return await this.fieldOfTrainingRepo.findPaginated(
      {
        isActive: true,
        ...(filter.searchKey && {
          [Op.or]: [
            { arName: { [Op.iLike]: `%${filter.searchKey}%` } },
            { enName: { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        })
      },
      null,
      paginate.page,
      paginate.limit
    );
  }

  async deleteFieldOfTraining(fieldOfTrainingId: string) {
    await this.fieldOfTrainingOrError(fieldOfTrainingId);
    const isUsed = await this.lecturerFieldOfTrainingRepo.findOne(
      { fieldOfTrainingId },
      [
        {
          model: Lecturer,
          where: {
            status: [ApprovalStatusEnum.APPROVED, ApprovalStatusEnum.PENDING]
          },
          required: true
        }
      ],
      ['fieldOfTrainingId']
    );
    if (isUsed)
      throw new BaseHttpException(ErrorCodeEnum.FIELD_OF_TRAINING_USED);
    await this.fieldOfTrainingRepo.deleteAll({ id: fieldOfTrainingId });
    return true;
  }

  async setLecturerFieldOfTraining(
    lecturer: Lecturer,
    fieldOfTrainingIds: string[],
    transaction: Transaction
  ) {
    const fieldOfTrainings = await this.fieldOfTrainingRepo.findAll({
      id: fieldOfTrainingIds,
      isActive: true
    });

    if (fieldOfTrainingIds.length !== fieldOfTrainings.length)
      throw new BaseHttpException(
        ErrorCodeEnum.FIELD_OF_TRAINING_DOES_NOT_EXIST
      );
    await lecturer.$set('fieldOfTrainings', fieldOfTrainings, { transaction });
  }

  async pendingLecturersFieldOfTraining(
    paginate: PaginatorInput = {}
  ): Promise<FieldOfTraining[]> {
    const fieldOfTrainings = await this.fieldOfTrainingRepo.findPaginated(
      {},
      'id',
      paginate.page,
      paginate.limit,
      [
        {
          model: Lecturer,
          where: { status: ApprovalStatusEnum.PENDING },
          attributes: [],
          through: {
            attributes: []
          }
        }
      ],
      null,
      null,
      null,
      '"FieldOfTraining"."id"'
    );
    return fieldOfTrainings as any;
  }
}
