import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { Repositories } from '../../../_common/database/database-repository.enum';
import { IRepository } from '../../../_common/database/repository.interface';
import { IDataLoaderService } from '../../../_common/dataloader/dataloader.interface';
import { HelperService } from '../../../_common/utils/helper.service';
import { BlogCategory } from '../../blog-category/bLog-category.model';
import { BlogTag } from '../../blog-tag/blog-tag.model';
import { Tag } from '../../blog-tag/tag.model';
import { BlogLike } from '../models/blog-like.entity';
import { Blog } from '../models/blog.model';

@Injectable()
export class BlogDataloader implements IDataLoaderService {
  constructor(
    @Inject(Repositories.BlogCategoriesRepository)
    private readonly blogCaregoryRepo: IRepository<BlogCategory>,
    private readonly helperService: HelperService,
    @Inject(Repositories.BlogsRepository)
    private readonly blogRepo: IRepository<Blog>,
    @Inject(Repositories.BlogTagsRepository)
    private readonly blogTagRepo: IRepository<BlogTag>,
    @Inject(Repositories.BlogLikeRepository)
    private readonly blogLikeRepo: IRepository<BlogLike>
  ) {}
  createLoaders() {
    return {
      blogCategoryLoader: new DataLoader(async (categoriesIds?: number[]) =>
        this.findBlogCategory(categoriesIds)
      ),
      blogTagsLoader: new DataLoader(async (blogIds: string[]) =>
        this.findBlogTags(blogIds)
      ),
      canBlogCategoryBeDeletedLoader: new DataLoader(
        async (blogCategoryIds: number[]) =>
          this.canBlogCategoryBeDeleted(blogCategoryIds)
      )
      // TODO: fix this
      // isLiked: new DataLoader(
      //   async (blogsIds: string[]) => await this.isLiked(blogsIds, userId)
      // )
    };
  }
  async findAuthor(authorsIds: number[]) {
    return [];
  }
  async findBlogTags(blogIds: string[]) {
    const blogsTags = await this.blogTagRepo.findAll(
      { blogId: blogIds },
      [Tag],
      'order'
    );
    const blogTagMap: Map<string, Tag[]> = new Map();

    blogsTags.forEach(blogTag => {
      const blogTagsInMap = blogTagMap.get(blogTag.blogId);
      if (!blogTagsInMap) {
        blogTagMap.set(blogTag.blogId, [blogTag.tag]);
      } else {
        blogTagsInMap.push(blogTag.tag);
      }
    });

    return blogIds.map(blogId => blogTagMap.get(blogId));
  }

  async findBlogCategory(categoriesIds?: number[]) {
    const categories = await this.blogCaregoryRepo.findAll({
      id: categoriesIds
    });
    const catMap = this.helperService.deriveMapFromArray(
      categories,
      categories => categories.id
    );
    return categoriesIds?.map(categoryId => catMap.get(categoryId) || null);
  }

  async canBlogCategoryBeDeleted(blogCategoryId: number[]) {
    const securityGroupUsers = await this.blogRepo.findAll(
      { categoryId: blogCategoryId },
      [],
      null,
      ['categoryId']
    );

    return blogCategoryId.map(categoryId => {
      const blog = securityGroupUsers.find(
        securityGroupUser => securityGroupUser.categoryId === categoryId
      );
      if (!blog) return true;
      if (blog) return false;
    });
  }

  async isLiked(blogsIds: string[], userId?: string) {
    if (!userId) {
      return blogsIds.map(() => false);
    }
    const likes = await this.blogLikeRepo.findAll({
      userId,
      blogId: { [Op.in]: blogsIds }
    });

    const map: Record<string, boolean> = {};

    likes.forEach(like => {
      map[like.blogId] = true;
    });

    return blogsIds.map(id => map[id] ?? false);
  }
}
