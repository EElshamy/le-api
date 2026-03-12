import { Inject, Injectable } from '@nestjs/common';
import { Op, col, fn } from 'sequelize';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { PaginatorInput } from '../../_common/paginator/paginator.input';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import { CourseStatusEnum } from '../../course/enums/course.enum';
import { Course } from '../../course/models/course.model';
import { CategorySortEnum } from './category.enum';
import { Category } from './category.model';
import {
  CategoriesBoardFilter,
  CategoriesBoardSort
} from './inputs/categories-board.input';
import { CreateCategoryInput } from './inputs/create-category.input';
import { DeleteCategoryInput } from './inputs/delete-category.input';
import { UpdateCategoryInput } from './inputs/update-category.input';
import { UploaderService } from '@src/_common/uploader/uploader.service';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(Repositories.CategoriesRepository)
    private readonly categoryRepo: IRepository<Category>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    private readonly uploaderService: UploaderService
  ) {}

  async createCategoryBoard(input: CreateCategoryInput) {
    const category = await this.categoryRepo.createOne(input);

    if (input.image) {
      await this.uploaderService.setUploadedFilesReferences(
        [input.image],
        'category',
        'image',
        category.id
      );
    }

    return category;
  }

  async bulkCreateCategoryBoard(input: CreateCategoryInput[]) {
    return await this.categoryRepo.bulkCreate(input);
  }

  async updateCategoryBoard(input: UpdateCategoryInput) {
    let category = await this.categoryOrError(input.categoryId);

    if (input.image) {
      console.log('input.image : ', input.image);
      await this.uploaderService.setUploadedFilesReferences(
        [input.image],
        'category',
        'image',
        category.id
      );

      await this.uploaderService.removeOldFilesReferences(
        [input.image],
        [category.image]
      );
    }

    return await this.categoryRepo.updateOne({ id: category.id }, input);
  }

  async deleteCategoryBoard(input: DeleteCategoryInput) {
    if (input.categoryId === input.reassignToCategoryId)
      throw new BaseHttpException(
        ErrorCodeEnum.CANNOT_REASSIGN_TO_THE_SAME_CATEGORY
      );
    const category = await this.categoryOrError(input.categoryId);
    /** check if category is in use by courses (except for drafted courses) */
    const isCategoryUsed = await this.courseRepo.findOne({
      categoryId: category.id,
      status: { [Op.ne]: CourseStatusEnum.DRAFTED }
    });

    if (isCategoryUsed && !input.reassignToCategoryId) {
      throw new BaseHttpException(
        ErrorCodeEnum.CANNOT_DELETE_CATEGORY_WITHOUT_REASSIGN
      );
    }

    if (isCategoryUsed) {
      await this.courseRepo.updateAll(
        { categoryId: category.id },
        { categoryId: input.reassignToCategoryId }
      );
    }

    return !!(await this.categoryRepo.deleteAll({ id: category.id }));
  }

  async categoryOrError(categoryId?: number, slug?: string) {
    let category;

    if (categoryId) {
      category = await this.categoryRepo.findOne({ id: categoryId });
    } else if (slug) {
      category = await this.categoryRepo.findOne({ slug });
    }

    if (!category) {
      throw new BaseHttpException(ErrorCodeEnum.CATEGORY_DOESNT_EXIST);
    }

    return category;
  }

  async activeCategoryOrError(categoryId: number) {
    const category = await this.categoryOrError(categoryId);
    if (!category.isActive)
      throw new BaseHttpException(ErrorCodeEnum.CATEGORY_DOESNT_EXIST);
    return category;
  }

  async categoriesBoard(
    filter: CategoriesBoardFilter = {},
    sort: CategoriesBoardSort = {
      sortBy: CategorySortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = {}
  ) {
    const categories = await this.categoryRepo.findPaginated(
      {
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.searchKey && {
          [Op.or]: [
            { arName: { [Op.iLike]: `%${filter.searchKey}%` } },
            { enName: { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        })
      },
      [[sort.sortBy, sort.sortType]],
      paginate.page,
      paginate.limit,
      [
        {
          model: Course,
          required: false,
          attributes: [],
          where: {
            status: { [Op.ne]: CourseStatusEnum.DRAFTED }
          }
        }
      ],
      { include: [[fn('COUNT', col('"categoryId"')), 'timesUsed']] },
      null,
      null,
      ['"Category"."id"']
    );

    return categories;
  }

  async activeCategories(paginate: PaginatorInput = {}) {
    return await this.categoryRepo.findPaginated(
      {
        isActive: true
      },
      null,
      paginate.page,
      paginate.limit
    );
  }

  async categoriesForSiteMap() {
    return await this.categoryRepo.findAll({ isActive: true });
  }
}
