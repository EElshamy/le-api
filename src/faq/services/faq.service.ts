import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { HelperService } from '@src/_common/utils/helper.service';
import { CodePrefix } from '@src/_common/utils/helpers.enum';
import { Op } from 'sequelize';
import { FaqSortEnum } from '../enums/faq-sort.enum';
import { FaqForEnum } from '../enums/faq.enum';
import { CreateFaqInput } from '../inputs/create-faq.input';
import { DeleteFaqInput } from '../inputs/delete-faq.input';
import { FaqSortInput } from '../inputs/faq-sort.input';
import { FaqInput } from '../inputs/faq.input';
import { FaqFilterBoard } from '../inputs/faqs-filter-board.input';
import { FaqsFilter } from '../inputs/faqs-filter.input';
import { UpdateFaqInput } from '../inputs/update-faq.input';
import { Faq } from '../models/faq.model';

@Injectable()
export class FaqService {
  constructor(
    @Inject(Repositories.FaqsRepository)
    private readonly faqRepo: IRepository<Faq>,
    private readonly helperService: HelperService
  ) {}

  async createFaqBoard(input: CreateFaqInput): Promise<Faq> {
    if (input.isPublished) {
      if (
        !input.enQuestion ||
        !input.arQuestion ||
        !input.enAnswer ||
        !input.arAnswer
      ) {
        throw new BaseHttpException(ErrorCodeEnum.MISSING_REQUIRED_FIELDS);
      }
    }

    return await this.faqRepo.createOne({
      ...input,
      code: await this.helperService.generateModelCodeWithPrefix(
        CodePrefix.FAQ,
        this.faqRepo
      )
    });
  }

  async updateFaqBoard(input: UpdateFaqInput): Promise<Faq> {
    const faq = await this.faqOrError(input.faqId);
    return await this.faqRepo.updateOneFromExistingModel(faq, input);
  }

  async deleteFaqBoard(input: DeleteFaqInput): Promise<Boolean> {
    await this.faqOrError(input.faqId);
    await this.faqRepo.deleteAll({ id: input.faqId });
    return true;
  }

  async faqOrError(faqId: string): Promise<Faq> {
    const faq = await this.faqRepo.findOne({ id: faqId });

    if (!faq) {
      throw new BaseHttpException(ErrorCodeEnum.FAQ_DOES_NOT_EXIST);
    }

    return faq;
  }

  async faqBoard(input: FaqInput): Promise<Faq> {
    return await this.faqOrError(input.faqId);
  }

  async faqsBoard(
    filter: FaqFilterBoard = {},
    sort: FaqSortInput = {
      sortBy: FaqSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = { page: 1, limit: 8 }
  ): Promise<PaginationRes<Faq>> {
    return await this.faqRepo.findPaginated(
      {
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.for && { for: filter.for }),
        ...(filter.searchKey && {
          [Op.or]: {
            enQuestion: { [Op.iLike]: `%${filter.searchKey}%` },
            arQuestion: { [Op.iLike]: `%${filter.searchKey}%` },
            code: { [Op.iLike]: `%${filter.searchKey}%` }
          }
        })
      },
      [[sort.sortBy, sort.sortType]],
      paginate.page,
      paginate.limit
    );
  }

  async lecuturerOrUserFaqs(
    faqFor: FaqForEnum,
    sort?: FaqSortInput
  ): Promise<Faq[]> {
    return await this.faqRepo.findAll(
      {
        for: { [Op.in]: [faqFor, FaqForEnum.ALL] },
        isPublished: true
      },
      null,
      [
        [
          sort?.sortBy || FaqSortEnum.CREATED_AT,
          sort?.sortType || SortTypeEnum.DESC
        ]
      ]
    );
  }

  async faqs(
    filter: FaqsFilter = {},
    paginate: PaginatorInput = {}
  ): Promise<PaginationRes<Faq>> {
    return await this.faqRepo.findPaginated(
      {
        isPublished: true,
        ...(filter.searchKey && {
          [Op.or]: {
            enQuestion: { [Op.iLike]: `%${filter.searchKey}%` },
            arQuestion: { [Op.iLike]: `%${filter.searchKey}%` }
          }
        })
      },
      '-createdAt',
      paginate.page,
      paginate.limit
    );
  }
}
