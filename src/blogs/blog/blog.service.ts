import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { GqlContext } from '@src/_common/graphql/graphql-context.type';
import { MailService } from '@src/_common/mail/mail.service';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { HelperService } from '@src/_common/utils/helper.service';
import { CodePrefix } from '@src/_common/utils/helpers.enum';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { User } from '@src/user/models/user.model';
import { Op, Sequelize } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import {
  NullablePaginatorInput,
  PaginatorInput
} from '../../_common/paginator/paginator.input';
import { UploaderService } from '../../_common/uploader/uploader.service';
import { BlogCategory } from '../blog-category/bLog-category.model';
import { BlogTag } from '../blog-tag/blog-tag.model';
import { Tag } from '../blog-tag/tag.model';
import { BlogSortEnum, BlogStatusEnum } from './blog.enum';
import { BlogMetricsInput } from './inputs/blog-metrics.input';
import { BlogInput } from './inputs/blog.input';
import { BlogsFilterBoard, BlogsSortInput } from './inputs/blogs-board.filter';
import { BlogsFilter } from './inputs/blogs.filter';
import { CreateBlogInput } from './inputs/ceate-blog.input';
import { CreateDraftBlogInput } from './inputs/create-draft-blog.input';
import { PublishDraftBlogInput } from './inputs/publish-draft-blog.input';
import { UpdateBlogInput } from './inputs/update-blog.input';
import { BlogLike } from './models/blog-like.entity';
import { BlogView } from './models/blog-view.entity';
import { Blog } from './models/blog.model';
import { NotificationService } from '@src/notification/notification.service';
import { SiteNotificationsTypeEnum } from '@src/notification/notification.enum';

@Injectable()
export class BlogService {
  constructor(
    @Inject(Repositories.BlogsRepository)
    private readonly blogRepo: IRepository<Blog>,
    @Inject(Repositories.BlogCategoriesRepository)
    private readonly blogCategoryRepo: IRepository<BlogCategory>,
    @Inject(Repositories.TagsRepository)
    private readonly tagRepo: IRepository<Tag>,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>,
    @Inject(Repositories.BlogLikeRepository)
    private readonly blogLikeRepo: IRepository<BlogLike>,
    @Inject(Repositories.BlogTagsRepository)
    private readonly blogTagRepo: IRepository<BlogTag>,
    @Inject(Repositories.BlogViewRepository)
    private readonly blogViewRepo: IRepository<BlogView>,
    private readonly uploaderService: UploaderService,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    private readonly helperService: HelperService,
    @Inject(MailService) private readonly mailService: MailService,
    private readonly siteNotificationService: NotificationService
  ) {}
  async createBlogBoard(
    input: CreateBlogInput | CreateDraftBlogInput,
    status: BlogStatusEnum
  ): Promise<Blog> {
    if (!this.helperService.validateObjectAtLeastOneKey(input)) {
      throw new BaseHttpException(ErrorCodeEnum.DRAFTED_BLOG_MUST_NOT_BE_EMPTY);
    }
    console.log('input', input.lecturerId);

    if (status === BlogStatusEnum.PUBLISHED) {
      if (!input.lecturerId) {
        throw new BaseHttpException(ErrorCodeEnum.LECTURER_IS_REQUIRED);
      }
      const lecturer = await this.lecturerRepo.findOne({
        id: input.lecturerId
      });
      if (!lecturer) {
        throw new BaseHttpException(ErrorCodeEnum.LECTURER_DOESNT_EXIST);
      }
      if (!lecturer.hasCompletedProfile) {
        throw new BaseHttpException(
          ErrorCodeEnum.LECTURER_PROFILE_NOT_COMPLETED
        );
      }
    }

    if (input.categoryId) await this.findCategoryOrError(input.categoryId);

    const blog = await this.blogRepo.createOne({
      ...input,
      status,
      code: await this.helperService.generateModelCodeWithPrefix(
        CodePrefix.BLOG,
        this.blogRepo
      ),
      publishedAt: status === BlogStatusEnum.PUBLISHED ? new Date() : null
    });

    if (input?.tagsIds && input?.tagsIds.length) {
      await this.setBlogTagReferences(input.tagsIds, blog.id);
    }

    if (input.thumbnail) {
      await this.setBlogUploadedFilesReferences(blog.thumbnail, blog.id);
    }

    if (input.contentImagesUrls && input.contentImagesUrls.length) {
      await this.setBlogContentUploadedFilesReferences(
        input.contentImagesUrls,
        blog.id
      );
    }

    // if (status === BlogStatusEnum.PUBLISHED) {
    //   //send emails and notifications to lecturer if his blog has been published
    //   await this.sendEmailAndNotificationToLecturer(blog);
    // }
    return blog;
  }
  async sendEmailAndNotificationToLecturer(blog: Blog) {
    const lecturer = await this.lecturerRepo.findOne(
      {
        id: blog.lecturerId
      },
      [
        {
          model: User
        }
      ]
    );

    //send email to the author of this blog that his blog has been published
    await this.mailService.send({
      to: lecturer?.user.email,
      template: 'puplication-approval',
      subject: `Congratulations! Your Blog Has Been Approved`,
      templateData: {
        url: 'https://instructor.leiaqa.com/',
        // url: 'https://staging-instructor.classeshub.com',
        lecturerName: lecturer.user.enFullName.split(' ')[0],
        programTitle: blog.enTitle,
        programTypeHeader: 'Blog',
        programType: 'blog'
      }
    });
    //send notification
    await this.siteNotificationService.createSiteNotification(
      SiteNotificationsTypeEnum.POST_PUBLISHED,
      {
        userId: lecturer.user.id,
        arPostTitle: blog.arTitle,
        enPostTitle: blog.enTitle,
        postId: blog.id
      }
    );
  }

  async createPublishedBlogBoard(input: CreateBlogInput): Promise<Blog> {
    if (input.categoryId) await this.findCategoryOrError(input.categoryId);

    const blog = await this.sequelize.transaction(async transaction => {
      const blog = await this.blogRepo.createOne(
        {
          ...input,
          status: BlogStatusEnum.PUBLISHED
        },
        transaction
      );
      await this.setBlogTagReferences(input.tagsIds, blog.id);
      return blog;
    });

    await this.setBlogUploadedFilesReferences(blog.thumbnail, blog.id);

    if (input.contentImagesUrls && input.contentImagesUrls.length)
      await this.setBlogContentUploadedFilesReferences(
        input.contentImagesUrls,
        blog.id
      );
    return blog;
  }

  // should it be toggle ??
  async draftPublishedBlogBoard(blogId: string): Promise<Blog> {
    const blog = await this.blogOrError(blogId);
    return await this.blogRepo.updateOneFromExistingModel(blog, {
      status: BlogStatusEnum.DRAFT
    });
  }

  async publishDraftBlogBoard(input: PublishDraftBlogInput): Promise<Blog> {
    const blog = await this.blogOrError(input.blogId);

    if (blog.status !== BlogStatusEnum.DRAFT) {
      throw new BaseHttpException(ErrorCodeEnum.THIS_BLOG_IS_NOT_DRAFTED);
    }

    // Validate before publishing
    const missingFields = this.validateForPublishing(blog);
    console.log(missingFields);

    if (missingFields.length) {
      throw new BaseHttpException(ErrorCodeEnum.MISSING_BLOG_FIELDS);
    }

    const publishedBlog = await this.blogRepo.updateOneFromExistingModel(blog, {
      status: BlogStatusEnum.PUBLISHED,
      publishedAt: new Date()
    });

    //send emails and notifications to lecturer that his blog has been published
    await this.sendEmailAndNotificationToLecturer(publishedBlog);

    return publishedBlog;
  }

  private validateForPublishing(blog: Blog): string[] {
    const requiredFields = [
      'enTitle',
      'arTitle',
      'enContent',
      'arContent',
      'categoryId',
      'lecturerId'
    ];

    const missingFields = requiredFields.filter(field => !blog[field]);

    return missingFields;
  }

  async setBlogTagReferences(
    tagsIds: number[],
    blogId: string,
    deleteAll = false
  ) {
    if (tagsIds?.length) {
      const tags = await this.tagRepo.findAll({ id: tagsIds }, [], null, [
        'id'
      ]);

      if (tags.length !== tagsIds.length) {
        throw new BaseHttpException(ErrorCodeEnum.BLOG_TAG_DOESNT_EXIST);
      }

      if (deleteAll) await this.blogTagRepo.deleteAll({ blogId: blogId });

      await this.blogTagRepo.bulkCreate(
        tagsIds.map((tagId, ind) => ({ blogId, tagId, order: ind + 1 }))
      );
    }
  }

  async updateBlogBoard(input: UpdateBlogInput): Promise<Blog> {
    let blog = await this.blogOrError(input.blogId);

    const { thumbnail, ...restInput } = input;

    blog = await this.blogRepo.updateOneFromExistingModel(blog, {
      ...restInput,
      ...(thumbnail !== undefined && thumbnail.length > 0 && { thumbnail })
    });

    await this.setBlogTagReferences(input.tagsIds, blog.id, true);

    if (thumbnail !== undefined && thumbnail.length > 0) {
      await this.setBlogUploadedFilesReferences(thumbnail, blog.id);
    }

    if (input.contentImagesUrls && input.contentImagesUrls.length) {
      await this.setBlogContentUploadedFilesReferences(
        input.contentImagesUrls,
        blog.id
      );
    }

    return blog;
  }

  async toggleBlogStatus(blogId: string) {
    const blog = await this.blogOrError(blogId);

    const newStatus =
      blog.status === BlogStatusEnum.PUBLISHED ?
        BlogStatusEnum.DRAFT
      : BlogStatusEnum.PUBLISHED;

    const missingFields = this.validateForPublishing(blog);
    if (missingFields.length) {
      throw new BaseHttpException(ErrorCodeEnum.MISSING_BLOG_FIELDS);
    }

    await this.blogRepo.updateOneFromExistingModel(blog, { status: newStatus });

    if (blog.status === BlogStatusEnum.PUBLISHED) {
      await this.sendEmailAndNotificationToLecturer(blog);
    }

    return true;
  }

  async blogForUser(input: BlogInput) {
    if ((!input.blogId && !input.slug) || (input.blogId && input.slug)) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    return await this.blogOrError(input.blogId, input.slug);
  }

  async toggleBlogLike(
    blogIds: string[],
    increment?: boolean,
    userId?: string
  ) {
    const blogs = await this.blogRepo.findAll({ id: blogIds });

    for (const blog of blogs) {
      if (!userId) {
        await this.updateBlogLikes(blog, increment);
        continue;
      }

      const existingLike = await this.blogLikeRepo.findOne({
        userId,
        blogId: blog.id
      });

      if (increment && !existingLike) {
        await this.blogLikeRepo.createOne({ blogId: blog.id, userId });
        await this.updateBlogLikes(blog, true);
      }

      if (!increment && existingLike) {
        await this.blogLikeRepo.deleteAll({ id: existingLike.id });
        await this.updateBlogLikes(blog, false);
      }
    }

    return true;
  }

  private async updateBlogLikes(blog: Blog, increment: boolean) {
    blog.likesCount += increment ? 1 : -1;
    await this.blogRepo.updateOneFromExistingModel(blog, {
      likesCount: blog.likesCount
    });
  }

  async incrementBlogMetrics(blogId: string, options: BlogMetricsInput) {
    const blog = await this.blogOrError(blogId);

    const { views, shares } = options;

    const updateFields: Partial<{ viewsCount: number; sharesCount: number }> =
      {};

    if (views) {
      updateFields.viewsCount = (blog.viewsCount || 0) + 1;
    }

    if (shares) {
      updateFields.sharesCount = (blog.sharesCount || 0) + 1;
    }

    await this.blogRepo.updateOne({ id: blogId }, updateFields);

    return true;
  }

  async findCategoryOrError(categoryId: number) {
    const category = await this.blogCategoryRepo.findOne({
      id: categoryId
    });
    if (!category)
      throw new BaseHttpException(ErrorCodeEnum.BLOG_CATEGORY_DOESNT_EXIST);
  }

  async blogOrError(blogId?: string, slug?: string): Promise<Blog> {
    const where: any = {};

    if (blogId) {
      where.id = blogId;
    } else if (slug) {
      where.slug = slug;
    }

    const blog = await this.blogRepo.findOne(where);

    if (!blog) {
      throw new BaseHttpException(ErrorCodeEnum.BLOG_NOT_FOUND);
    }
    return blog;
  }
  /* ********************************************************************************************************* */

  private async setBlogUploadedFilesReferences(
    thumbnail: string,
    blogId: string
  ) {
    await this.uploaderService.setUploadedFilesReferences(
      [thumbnail],
      'Blog',
      'thumbnail',
      blogId
    );
  }

  //it's included in the content itself so it cannot be extracted
  private async setBlogContentUploadedFilesReferences(
    contentImagesUrls: string[],
    blogId: string
  ) {
    await this.uploaderService.setUploadedFilesReferences(
      contentImagesUrls,
      'Blog',
      'arContent',
      blogId
    );
  }

  async blogsBoard(
    filter: BlogsFilterBoard = {},
    paginate: PaginatorInput = {},
    sort: BlogsSortInput
  ): Promise<PaginationRes<Blog>> {
    const blogs = await this.blogRepo.findPaginated(
      {
        ...(filter?.categoryId && { categoryId: filter.categoryId }),
        ...(filter?.lecturerId && { lecturerId: filter.lecturerId }),
        ...(filter?.status && { status: filter.status }),
        ...(filter?.searchKey && {
          [Op.or]: [
            { code: { [Op.iLike]: `%${filter.searchKey}%` } },
            { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { arContent: { [Op.iLike]: `%${filter.searchKey}%` } },
            { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { enContent: { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        })
      },
      [
        [
          sort?.sortBy || BlogSortEnum.CREATED_AT,
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginate?.page,
      paginate?.limit
    );

    return blogs;
  }

  async lecturerBlogsBoard(
    lecturerId: string,
    filter: BlogsFilterBoard = {},
    sort: BlogsSortInput = {
      sortBy: BlogSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = { page: 1, limit: 8 }
  ) {
    return await this.blogRepo.findPaginated(
      {
        lecturerId,
        ...(filter?.status && { status: filter.status }),
        ...(filter?.categoryId && { categoryId: filter.categoryId }),
        ...(filter?.searchKey && {
          [Op.or]: [
            { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { code: { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        })
      },
      [
        [
          sort?.sortBy || BlogSortEnum.CREATED_AT,
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginate.page,
      paginate.limit
    );
  }

  async blogs(
    filter: BlogsFilter = {},
    sort: BlogsSortInput = {
      sortBy: BlogSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = { page: 1, limit: 12 }
  ) {
    return await this.blogRepo.findPaginated(
      {
        status: BlogStatusEnum.PUBLISHED,
        ...(filter.searchKey && {
          [Op.or]: [
            { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.enName$': { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.arName$': { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        }),
        ...(filter?.categoryIds?.length > 0 && {
          categoryId: { [Op.in]: filter.categoryIds }
        }),
        ...(filter?.lecturerId && { lecturerId: filter.lecturerId })
      },
      [
        [
          sort?.sortBy || BlogSortEnum.CREATED_AT,
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginate.page,
      paginate.limit,
      [
        {
          model: BlogCategory,
          as: 'category',
          ...(filter?.categorySlug && {
            where: { slug: filter.categorySlug }
          })
        },
        (filter.tagIds || filter.TagSlug) && {
          model: Tag,
          attributes: [],
          where: {
            ...(filter.tagIds && { id: { [Op.in]: filter.tagIds } }),
            ...(filter.TagSlug && { slug: filter.TagSlug })
          }
        }
      ].filter(Boolean),
      undefined,
      false
    );
  }

  async recommendedBlogs(blogId: string, pagination?: NullablePaginatorInput) {
    const blog = await this.blogOrError(blogId);

    return await this.blogRepo.findPaginated(
      {
        id: { [Op.ne]: blogId },
        status: BlogStatusEnum.PUBLISHED,
        categoryId: blog.categoryId
      },
      [[BlogSortEnum.VIEWES, SortTypeEnum.DESC]],
      pagination?.paginate?.page || 1,
      pagination?.paginate?.limit || 3
    );
  }

  async deleteBlogBoard(blogId: string) {
    const blog = await this.blogOrError(blogId);
    return await this.blogRepo.deleteAll({ id: blog.id });
  }

  async isLiked(blogId: string, userId: string) {
    if (!userId) {
      return false;
    }

    const blog = await this.blogOrError(blogId);

    const like = await this.blogLikeRepo.findOne({
      blogId: blogId,
      ...(userId && { userId })
    });

    return !!like;
  }

  async trackBlogView(
    user: User | null,
    context: GqlContext,
    blogId?: string,
    slug?: string
  ) {
    const ipAddress = context.ipAddress;
    const userAgent = context.req.headers['user-agent'];

    const where: any = {};
    if (blogId) where.id = blogId;
    else if (slug) where.slug = slug;

    const blog = await this.blogRepo.findOne(where);

    if (!blog) return;

    // Prevent duplicate views (e.g., user refreshing the page)
    const existingView = await this.blogViewRepo.findOne({
      blogId: blog.id,
      ...(user?.id && { userId: user.id }),
      ipAddress: user ? null : ipAddress, // Track guest views by IP
      createdAt: {
        [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) // Last 1 hour
      }
    });

    if (!existingView) {
      await this.blogViewRepo.createOne({
        blogId: blog.id,
        userId: user ? user.id : null,
        ipAddress: user ? null : ipAddress, // Only store IP if guest
        userAgent
      });

      // Increment blog's total views
      blog.viewsCount = (blog.viewsCount || 0) + 1;

      await this.blogRepo.updateOne(
        { id: blog.id },
        { viewsCount: blog.viewsCount }
      );
    }
  }

  async blogsForSiteMap() {
    const blogs = await this.blogRepo.findAll({
      status: BlogStatusEnum.PUBLISHED
    });

    return blogs.map(blog => ({
      id: blog.id,
      type: null,
      updatedAt: blog.updatedAt
    }));
  }
}
