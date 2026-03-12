import { Inject } from '@nestjs/common';
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
import { BlogTag } from './blog-tag.model';
import { BlogTagsFilterBoard } from './inputs/blog-tag.filter.input';
import { CreateTagInput } from './inputs/create-blog-tag.input';
import { UpdateTagInput } from './inputs/update-tag.input';
import { Tag } from './tag.model';

export class BlogTagService {
  constructor(
    @Inject(Repositories.TagsRepository)
    private readonly blogTagRepo: IRepository<Tag>,
    @Inject(Repositories.BlogTagsRepository)
    private readonly blogTagsRepo: IRepository<BlogTag>
  ) {}

  async createTagBoard(input: CreateTagInput[]) {
    return !!(await this.blogTagRepo.bulkCreate(input));
  }

  async updateTagBoard(input: UpdateTagInput) {
    const tag = await this.tagOrError(input.tagId);
    return await this.blogTagRepo.updateOneFromExistingModel(tag, {
      ...input
    });
  }

  async tagsBoard(
    filter: BlogTagsFilterBoard = {},
    sort: CategoriesBoardSort = {
      sortBy: CategorySortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = { page: 1, limit: 10 }
  ) {
    const { page, limit } = paginate;

    const tags = await this.blogTagRepo.findAll(
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
          as: 'blogTags',
          through: { attributes: [] },
          required: false,
          attributes: [],
          where: { status: { [Op.ne]: BlogStatusEnum.DRAFT } }
        }
      ],
      sort.sortBy === 'timesUsed' ?
        [[literal('"timesUsed"'), sort.sortType]]
      : [[sort.sortBy, sort.sortType]],
      {
        include: [[fn('COUNT', col('"blogTags"."id"')), 'timesUsed']]
      },
      ['"Tag"."id"'] // group by
    );

    const uniqueTags = Array.from(
      new Map(tags.map(tag => [tag.id, tag])).values()
    );

    const totalCount = uniqueTags.length;
    const totalPages = limit ? Math.ceil(totalCount / limit) : 1;
    const offset = (page - 1) * limit;
    const paginatedItems = uniqueTags.slice(offset, offset + limit);

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

  async tags() {
    return await this.blogTagRepo.findAll({ isActive: true });
  }

  async tagOrError(tagId: number) {
    const tag = await this.blogTagRepo.findOne({ id: tagId });
    if (!tag) throw new BaseHttpException(ErrorCodeEnum.BLOG_TAG_DOESNT_EXIST);
    return tag;
  }

  async deleteTagBoard(tagId: number, reassignToTagId?: number) {
    if (tagId === reassignToTagId) {
      throw new BaseHttpException(
        ErrorCodeEnum.CANNOT_REASSIGN_TO_THE_SAME_TAG
      );
    }

    const tag = await this.tagOrError(tagId);

    const isTagUsed = await this.blogTagsRepo.findOne({ tagId: tag.id }, [
      {
        model: Blog,
        attributes: [],
        required: true,
        where: { status: { [Op.ne]: BlogStatusEnum.DRAFT } }
      }
    ]);

    if (isTagUsed && !reassignToTagId) {
      throw new BaseHttpException(
        ErrorCodeEnum.CANNOT_DELETE_TAG_WITHOUT_REASSIGN
      );
    }

    if (isTagUsed) {
      await this.blogTagsRepo.updateAll(
        { tagId: tag.id },
        { tagId: reassignToTagId }
      );
    }

    return !!(await this.blogTagRepo.deleteAll({ id: tag.id }));
  }

  async blogTagsForSiteMap() {
    const blogTags = await this.blogTagRepo.findAll({
      isActive: true
    });

    return blogTags.map(tag => ({
      id: tag.id,
      type: null,
      updatedAt: tag.updatedAt
    }));
  }
}
