import { Inject, Injectable } from '@nestjs/common';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { CategorySortEnum } from '@src/course-specs/category/category.enum';
import { CategoriesBoardSort } from '@src/course-specs/category/inputs/categories-board.input';
import { col, fn, literal, Op } from 'sequelize';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { PaginatorInput } from '../../_common/paginator/paginator.input';
import { BlogStatusEnum } from '../blog/blog.enum';
import { Blog } from '../blog/models/blog.model';
import { BlogCategory } from './bLog-category.model';
import { BlogCategoriesFilterBoard } from './inputs/categories-filter.input';
import { CreateBlogCategoryInput } from './inputs/create-category.input';
import { UpdateBlogCategoryInput } from './inputs/update-category.input';

@Injectable()
export class BlogCategoryService {
  constructor(
    @Inject(Repositories.BlogCategoriesRepository)
    private readonly blogCategoryRepo: IRepository<BlogCategory>,
    @Inject(Repositories.BlogsRepository)
    private readonly blogRepo: IRepository<Blog>
  ) {}

  async createCategoryBoard(input: CreateBlogCategoryInput[]) {
    return !!(await this.blogCategoryRepo.bulkCreate(input));
  }

  async updateCategoryBoard(input: UpdateBlogCategoryInput) {
    const category = await this.categoryOrError(input.categoryId);
    return await this.blogCategoryRepo.updateOneFromExistingModel(category, {
      ...input
    });
  }

  async categoriesBoard(
    filter: BlogCategoriesFilterBoard = {},
    sort: CategoriesBoardSort = {
      sortBy: CategorySortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = { page: 1, limit: 10 }
  ) {
    const { page, limit } = paginate;

    const categories = await this.blogCategoryRepo.findAll(
      {
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.searchKey && {
          [Op.or]: [
            { arName: { [Op.iLike]: `%${filter.searchKey}%` } },
            { enName: { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        })
      },
      [
        {
          model: Blog,
          as: 'blogs',
          required: false,
          attributes: [],
          where: { status: { [Op.ne]: BlogStatusEnum.DRAFT } }
        }
      ],
      sort.sortBy === CategorySortEnum.TIMES_USED ?
        [[literal('"timesUsed"'), sort.sortType]]
      : [[sort.sortBy, sort.sortType]],
      {
        include: [[fn('COUNT', col('"blogs"."id"')), 'timesUsed']]
      },
      ['"BlogCategory"."id"'] // group by
    );

    const uniqueCategories = Array.from(
      new Map(categories.map(cat => [cat.id, cat])).values()
    );

    const totalCount = uniqueCategories.length;
    const totalPages = limit ? Math.ceil(totalCount / limit) : 1;

    const offset = (page - 1) * limit;
    const paginatedItems = uniqueCategories.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      pageInfo: {
        page,
        limit,
        hasNext: page < totalPages,
        hasBefore: page > 1,
        currentPage: page,
        totalPages,
        totalCount
      }
    };
  }

  // async categoriesBoard(
  //   filter: BlogCategoriesFilterBoard = {},
  //   sort: CategoriesBoardSort = {
  //     sortBy: CategorySortEnum.CREATED_AT,
  //     sortType: SortTypeEnum.DESC
  //   },
  //   paginate: PaginatorInput = {}
  // ) {
  //   const { page = 1, limit = 8 } = paginate;

  //   // 1) هات الـ data
  //   const categories = await this.blogCategoryRepo.findPaginated(
  //     {
  //       ...(filter.isActive !== undefined && { isActive: filter.isActive }),
  //       ...(filter.searchKey && {
  //         [Op.or]: [
  //           { arName: { [Op.iLike]: `%${filter.searchKey}%` } },
  //           { enName: { [Op.iLike]: `%${filter.searchKey}%` } }
  //         ]
  //       })
  //     },
  //     [[sort.sortBy, sort.sortType]],
  //     page,
  //     limit,
  //     [
  //       {
  //         model: Blog,
  //         as : 'blogs',
  //         required: false,
  //         where: {
  //           status: BlogStatusEnum.PUBLISHED
  //         }
  //       }
  //     ]
  //   );

  //   categories.items.forEach(cat => {
  //     console.log('cat id:', cat.id);
  //     console.log('blogs count:', cat.blogs.length);
  //     // console.log('blogs:', cat.blogs.map(b => b.id));
  //     console.log('-----------------');
  //   });

  //   // 2) timesUsed calculation
  //   const itemsWithTimesUsed = categories.items.map(cat => ({
  //     ...cat, // plain object, no need toJSON()
  //     timesUsed: cat.blogs ? cat.blogs.length : 0
  //   }));

  //   // 3) sorting by timesUsed (JS level)
  //   let sortedItems = itemsWithTimesUsed;
  //   if (sort.sortBy === CategorySortEnum.TIMES_USED) {
  //     sortedItems = [...itemsWithTimesUsed].sort((a, b) =>
  //       sort.sortType === SortTypeEnum.ASC
  //         ? a.timesUsed - b.timesUsed
  //         : b.timesUsed - a.timesUsed
  //     );
  //   }

  //   // 4) manual pagination
  //   const start = (page - 1) * limit;
  //   const end = start + limit;
  //   const paginatedItems = sortedItems.slice(start, end);

  //   return {
  //     items: paginatedItems,
  //     pageInfo: {
  //       page,
  //       limit,
  //       totalCount: sortedItems.length,
  //       totalPages: Math.ceil(sortedItems.length / limit),
  //       hasNext: end < sortedItems.length,
  //       hasBefore: page > 1
  //     }
  //   };
  // }

  async categories() {
    return await this.blogCategoryRepo.findAll({}, [
      {
        model: Blog,
        required: true,
        attributes: [],
        where: { PublishedAt: { [Op.ne]: null } }
      }
    ]);
  }

  async categoriesListBoard() {
    return await this.blogCategoryRepo.findAll({
      isActive: true
    });
  }

  async categoryOrError(categoryId: number) {
    const category = await this.blogCategoryRepo.findOne({ id: categoryId });

    if (!category) {
      throw new BaseHttpException(ErrorCodeEnum.BLOG_CATEGORY_DOESNT_EXIST);
    }

    return category;
  }

  async deleteCategoryBoard(categoryId: number, reassignToCategoryId?: number) {
    if (categoryId === reassignToCategoryId) {
      throw new BaseHttpException(
        ErrorCodeEnum.CANNOT_REASSIGN_TO_THE_SAME_CATEGORY
      );
    }

    const category = await this.categoryOrError(categoryId);

    const isCategoryUsed = await this.blogRepo.findOne({
      categoryId: category.id,
      status: { [Op.ne]: BlogStatusEnum.DRAFT }
    });

    if (isCategoryUsed && !reassignToCategoryId) {
      throw new BaseHttpException(
        ErrorCodeEnum.CANNOT_DELETE_CATEGORY_WITHOUT_REASSIGN
      );
    }

    if (isCategoryUsed) {
      await this.blogRepo.updateAll(
        { categoryId: category.id },
        { categoryId: reassignToCategoryId }
      );
    }

    return !!(await this.blogCategoryRepo.deleteAll({ id: category.id }));
  }

  async blogCategoriesForSiteMap() {
    const blogCategories = await this.blogCategoryRepo.findAll({
      isActive: true
    });

    return blogCategories.map(category => ({
      id: category.id,
      type: null,
      updatedAt: category.updatedAt
    }));
  }
}
