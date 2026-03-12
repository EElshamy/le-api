import { Inject, Injectable } from '@nestjs/common';
import { Op, Order, col, fn } from 'sequelize';
import { Repositories } from '../_common/database/database-repository.enum';
import { IRepository } from '../_common/database/repository.interface';
import { BaseHttpException } from '../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../_common/exceptions/error-code.enum';
import { PaginatorInput } from '../_common/paginator/paginator.input';
import { SortTypeEnum } from '../_common/paginator/paginator.types';
import { ApprovalStatusEnum } from '../lecturer/enums/lecturer.enum';
import { Lecturer } from '../lecturer/models/lecturer.model';
import { CreateJobTitleBoardInput } from './inputs/create-job-title.input';
import {
  JobTitlesBoardFilter,
  JobTitlesBoardSort
} from './inputs/job-titles-board.input';
import { UpdateJobTitleBoardInput } from './inputs/update-job-title.input';
import { JobTitleSortEnum } from './job-title.enum';
import { JobTitle } from './job-title.model';

@Injectable()
export class JobTitleService {
  constructor(
    @Inject(Repositories.JobTitlesRepository)
    private readonly jobTitleRepo: IRepository<JobTitle>,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>
  ) {}

  async createJobTitleBoard(
    input: CreateJobTitleBoardInput
  ): Promise<JobTitle> {
    return await this.jobTitleRepo.createOne(input);
  }

  async updateJobTitleBoard(
    input: UpdateJobTitleBoardInput
  ): Promise<JobTitle> {
    const jobTitle = await this.jobTitleOrError(input.jobTitleId);
    return await this.jobTitleRepo.updateOneFromExistingModel(jobTitle, input);
  }

  async jobTitleOrError(jobTitleId: string) {
    const jobTitle = await this.jobTitleRepo.findOne(
      { id: jobTitleId }
      // [
      //   {
      //     model: Lecturer,
      //     required: false,
      //     attributes: [],
      //     where: {
      //       status: [ApprovalStatusEnum.APPROVED, ApprovalStatusEnum.PENDING]
      //     }
      //   }
      // ],
      // [],
    );
    if (!jobTitle)
      throw new BaseHttpException(ErrorCodeEnum.JOB_TITLE_DOES_NOT_EXIST);
    return jobTitle;
  }
  async jobTitleForLecturerRegisterationOrError(jobTitleId: string) {
    const jobTitle = await this.jobTitleOrError(jobTitleId);
    if (!jobTitle.isActive)
      throw new BaseHttpException(ErrorCodeEnum.JOB_TITLE_IS_NOT_ACTIVE);
    console.log('inside jobTitleForLecturerRegisterationOrError');
  }

  async jobTitlesBoard(
    filter: JobTitlesBoardFilter = {},
    paginate: PaginatorInput = {},
    sort: JobTitlesBoardSort = {
      sortBy: JobTitleSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    }
  ) {
    return await this.jobTitleRepo.findPaginated(
      {
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.searchKey && {
          [Op.or]: [
            { arName: { [Op.iLike]: `%${filter.searchKey}%` } },
            { enName: { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        })
      },
      this.sortJobTitlesBoard(sort),
      paginate.page,
      paginate.limit,
      [
        {
          model: Lecturer,
          required: false,
          attributes: [],
          where: {
            status: [ApprovalStatusEnum.APPROVED, ApprovalStatusEnum.PENDING]
          }
        }
      ],
      { include: [[fn('COUNT', col('"jobTitleId"')), 'timesUsed']] },
      false,
      false,
      ['"JobTitle"."id"']
    );
  }

  private sortJobTitlesBoard(sort: JobTitlesBoardSort): Order {
    return [[sort.sortBy, sort.sortType]];
  }
  async jobTitles(paginate: PaginatorInput = {}, filter: any = {}) {
    return await this.jobTitleRepo.findPaginated(
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

  async deleteJobTitle(jobTitleId: string) {
    await this.jobTitleOrError(jobTitleId);
    const isUsed = await this.lecturerRepo.findOne(
      {
        jobTitleId,
        status: [ApprovalStatusEnum.APPROVED, ApprovalStatusEnum.PENDING]
      },
      [],
      ['jobTitleId']
    );
    if (isUsed) throw new BaseHttpException(ErrorCodeEnum.JOB_TITLE_USED);
    await this.jobTitleRepo.deleteAll({ id: jobTitleId });
    return true;
  }
  async timeUsed(jobTitleId: string) {
    return (
      await this.lecturerRepo.findAll({
        jobTitleId,
        status: [ApprovalStatusEnum.APPROVED, ApprovalStatusEnum.PENDING]
      })
    )?.length;
  }
}
