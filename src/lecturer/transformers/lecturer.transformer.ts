import { Injectable } from '@nestjs/common';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { HelperService } from '@src/_common/utils/helper.service';
import { FieldOfTraining } from '@src/field-of-training/field-of-training.model';
import { User } from '@src/user/models/user.model';
import { Includeable, Op, Order, WhereOptions } from 'sequelize';
import {
  ApprovalStatusEnum,
  LecturersRequestsBoardSortEnum
} from '../enums/lecturer.enum';
import {
  LecturerRequestsBoardFilter,
  LecturerRequestsBoardSort
} from '../inputs/lecturer-requests-board.input';
import { Lecturer } from '../models/lecturer.model';

@Injectable()
export class LecturerTransformer {
  constructor(private readonly helperService: HelperService) {}

  lecturerRequestsBoardTransformer(
    paginate: PaginatorInput = { page: 1, limit: 15 },
    filter: LecturerRequestsBoardFilter = {},
    sort: LecturerRequestsBoardSort = {
      sortType: SortTypeEnum.DESC,
      sortBy: LecturersRequestsBoardSortEnum.CREATED_AT
    }
  ): [WhereOptions, Order, number, number, Includeable[]] {
    if (filter?.yearsOfExperienceRange?.length) {
      filter.yearsOfExperienceRange
        .sort((a, b) => a.minYear - b.minYear)
        .forEach(input => {
          if (input.minYear >= input.maxYear)
            throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
        });
    }

    return [
      {
        status: [ApprovalStatusEnum.PENDING, ApprovalStatusEnum.REJECTED],
        ...(filter?.status && { status: filter?.status })
      },
      [[sort?.sortBy, sort?.sortType]],
      paginate?.page ? paginate?.page : 1,
      paginate?.limit ? paginate?.limit : 15,
      [
        {
          model: Lecturer,
          attributes: [],
          required: true,
          where: {
            ...(filter?.jobTitleId && { jobTitleId: filter?.jobTitleId }),
            ...(filter?.yearsOfExperienceRange?.length && {
              yearsOfExperience: {
                [Op.or]: filter?.yearsOfExperienceRange.map(range => ({
                  [Op.and]: [
                    { [Op.lt]: range?.maxYear },
                    { [Op.gte]: range?.minYear }
                  ]
                }))
              }
            })
          },
          include: [
            {
              model: User,
              required: true,
              where: {
                email: {
                  [Op.ne]: null
                },
                ...(filter?.searchKey && {
                  [Op.or]: [
                    {
                      arFullName: {
                        [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
                      }
                    },
                    {
                      enFullName: {
                        [Op.iLike]: `%${this.helperService.trimAllSpaces(filter?.searchKey)}%`
                      }
                    },
                    {
                      email: {
                        [Op.iLike]: `%${this.helperService.trimAllSpaces(filter?.searchKey)}%`
                      }
                    },
                    {
                      code: {
                        [Op.iLike]: `%${this.helperService.trimAllSpaces(filter?.searchKey)}%`
                      }
                    },
                    {
                      phone: {
                        [Op.iLike]: `%${this.helperService.trimAllSpaces(filter?.searchKey)}%`
                      }
                    }
                  ]
                })
              },
              attributes: []
            },
            ...(filter?.fieldOfTrainigIds?.length
              ? [
                  {
                    model: FieldOfTraining,
                    required: true,
                    through: {
                      where: {
                        fieldOfTrainingId: {
                          [Op.in]: filter?.fieldOfTrainigIds
                        }
                      }
                    }
                  }
                ]
              : [])
          ]
        }
      ]
    ];
  }
}
