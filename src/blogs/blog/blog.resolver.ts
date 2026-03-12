import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { Loader } from '@src/_common/decorators/loader.decorator';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { GqlContext } from '@src/_common/graphql/graphql-context.type';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { User } from '@src/user/models/user.model';
import DataLoader from 'dataloader';
import { Transactional } from 'sequelize-transactional-typescript';
import { IDataLoaders } from '../../_common/dataloader/dataloader.interface';
import { GqlBooleanResponse } from '../../_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '../../_common/paginator/paginator.input';
import { CurrentUser } from '../../auth/auth-user.decorator';
import { AuthGuard } from '../../auth/auth.guard';
import { HasPermission, HasRole } from '../../auth/auth.metadata';
import { BlogPermissionsEnum } from '../../security-group/security-group-permissions';
import { LangEnum, UserRoleEnum } from '../../user/user.enum';
import { BlogCategory } from '../blog-category/bLog-category.model';
import { Tag } from '../blog-tag/tag.model';
import { BlogStatusEnum } from './blog.enum';
import { GqlBlogResponse, GqlBlogsResponse } from './blog.response';
import { BlogService } from './blog.service';
import { BlogMetricsInput } from './inputs/blog-metrics.input';
import { BlogInput } from './inputs/blog.input';
import {
  BlogsFilterBoardInput,
  BlogsSortBoardInput
} from './inputs/blogs-board.filter';
import { BlogsFilterInput } from './inputs/blogs.filter';
import { CreateBlogInput } from './inputs/ceate-blog.input';
import { CreateDraftBlogInput } from './inputs/create-draft-blog.input';
import { DeleteBlogInput } from './inputs/delete-blog.input';
import { PublishDraftBlogInput } from './inputs/publish-draft-blog.input';
import { UpdateBlogInput } from './inputs/update-blog.input';
import { AuthorsLoader } from './loaders/authors.loader';
import { Blog } from './models/blog.model';
import { GqlSiteMapResponse } from '@src/_common/graphql/site-map.resoponse';

@Resolver(() => Blog)
export class BlogResolver {
  constructor(private readonly blogService: BlogService) {}

  //************************************ QUERIES ******************************** */

  @UseGuards(AuthGuard)
  @HasPermission(BlogPermissionsEnum.READ_BLOGS)
  @Query(returns => GqlBlogResponse)
  async blogBoard(@Args() input: BlogInput) {
    return await this.blogService.blogOrError(input.blogId);
  }

  @Query(returns => GqlBlogResponse)
  @Transactional()
  async blog(@Args() input: BlogInput, @Context() context: GqlContext) {
    if (
      context?.currentUser?.role === UserRoleEnum.USER ||
      !context?.currentUser
    ) {
      await this.blogService.trackBlogView(
        context.currentUser,
        context,
        input.blogId,
        input.slug
      );
    }

    return await this.blogService.blogForUser(input);
  }

  @UseGuards(AuthGuard)
  @HasPermission(BlogPermissionsEnum.READ_BLOGS)
  @Query(returns => GqlBlogsResponse)
  async blogsBoard(
    @Args() filter: BlogsFilterBoardInput,
    @Args() sort: BlogsSortBoardInput,
    @Args() paginate: NullablePaginatorInput
  ) {
    return await this.blogService.blogsBoard(
      filter.filter,
      paginate.paginate,
      sort?.sort
    );
  }

  @Query(returns => GqlBlogsResponse)
  async blogs(
    @Args() filter: BlogsFilterInput,
    @Args() sort: BlogsSortBoardInput,
    @Args() paginate: NullablePaginatorInput
  ) {
    return await this.blogService.blogs(
      filter.filter,
      sort?.sort,
      paginate.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Query(returns => GqlBlogsResponse)
  async lecturerBlogsBoard(
    @CurrentUser() user: User,
    @Args('lecturerId', { nullable: true }) lecturerId: string,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: BlogsSortBoardInput,
    @Args() filter: BlogsFilterBoardInput
  ) {
    if (!user?.lecturer?.id && !lecturerId) {
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);
    }

    return this.blogService.lecturerBlogsBoard(
      user?.lecturer?.id || lecturerId,
      filter.filter,
      sort.sort,
      paginate.paginate
    );
  }

  @Query(() => GqlBlogsResponse)
  async recommendedBlogs(
    @Args('blogId') blogId: string,
    @Args() pagination?: NullablePaginatorInput
  ): Promise<PaginationRes<Blog>> {
    return await this.blogService.recommendedBlogs(blogId, pagination);
  }

  @Query(() => GqlSiteMapResponse)
  async blogsForSiteMap() {
    return await this.blogService.blogsForSiteMap();
  }
  //************************************ MUTATIONS ******************************** */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogPermissionsEnum.CREATE_BLOGS)
  @Mutation(returns => GqlBlogResponse)
  @Transactional()
  async createDraftBlogBoard(@Args('input') input: CreateDraftBlogInput) {
    return await this.blogService.createBlogBoard(input, BlogStatusEnum.DRAFT);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogPermissionsEnum.CREATE_BLOGS)
  @Mutation(returns => GqlBlogResponse)
  @Transactional()
  async createBlogBoard(@Args('input') input: CreateBlogInput) {
    return await this.blogService.createBlogBoard(
      input,
      BlogStatusEnum.PUBLISHED
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogPermissionsEnum.UPDATE_BLOGS)
  @Mutation(returns => GqlBlogResponse)
  @Transactional()
  async publishDraftBlogBoard(@Args('input') input: PublishDraftBlogInput) {
    return await this.blogService.publishDraftBlogBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogPermissionsEnum.UPDATE_BLOGS)
  @Mutation(returns => GqlBlogResponse)
  @Transactional()
  async updateBlogBoard(@Args('input') input: UpdateBlogInput) {
    return await this.blogService.updateBlogBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogPermissionsEnum.UPDATE_BLOGS)
  @Mutation(returns => GqlBooleanResponse)
  @Transactional()
  async toggleBlogStatus(
    @Args('blogId', { type: () => String }) blogId: string
  ) {
    return await this.blogService.toggleBlogStatus(blogId);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogPermissionsEnum.DELETE_BLOGS)
  @Mutation(returns => GqlBooleanResponse)
  @Transactional()
  async deleteBlogBoard(@Args() input: DeleteBlogInput) {
    return await this.blogService.deleteBlogBoard(input.blogId);
  }

  @UseGuards(AuthGuard)
  @Mutation(returns => GqlBooleanResponse)
  @Transactional()
  async toggleBlogLike(
    @Args('blogIds', { type: () => [String] }) blogIds: string[],
    @Args('increment', { type: () => Boolean }) increment: boolean,
    @CurrentUser() user: User
  ) {
    return await this.blogService.toggleBlogLike(blogIds, increment, user?.id);
  }

  @Mutation(returns => GqlBooleanResponse)
  @Transactional()
  async incrementBlogMetrics(
    @Args('blogId') blogId: string,
    @Args('options') options: BlogMetricsInput
  ) {
    return await this.blogService.incrementBlogMetrics(blogId, options);
  }

  //************************************ RESOLVE FIELDS ******************************** */

  @ResolveField(type => User, { nullable: true })
  async lecturer(
    @Parent() blog: Blog,
    @Loader(AuthorsLoader) authorsLoader: DataLoader<string, Lecturer>
  ) {
    if (!blog?.lecturerId) return null;

    return authorsLoader.load(blog?.lecturerId);
  }

  @ResolveField(type => BlogCategory, { nullable: true })
  async category(
    @Parent() blog: Blog,
    @Context('loaders') loaders: IDataLoaders
  ) {
    if (!blog?.categoryId) return null;
    return loaders.blogCategoryLoader.load(blog?.categoryId);
  }
  @ResolveField(type => [Tag], { nullable: true })
  async tags(@Parent() blog, @Context('loaders') loaders: IDataLoaders) {
    return loaders.blogTagsLoader.load(blog?.id);
  }

  @ResolveField(() => String)
  localizedTitle(@Parent() blog, @Context('lang') lang: LangEnum) {
    return blog[`${lang.toLowerCase()}Title`] ?? blog.arTitle;
  }

  @ResolveField(() => String)
  localizedContent(@Parent() blog, @Context('lang') lang: LangEnum) {
    return blog[`${lang.toLowerCase()}Content`] ?? blog.arContent;
  }

  @ResolveField(() => Timestamp)
  createdAt(blog: Blog) {
    return blog.createdAt.valueOf();
  }

  //TODO: make this loader
  // @ResolveField(() => Boolean)
  // liked(
  //   @Parent() blog: Blog,
  //   @Context('loaders') loaders: IDataLoaders,
  //   @CurrentUser() user: User
  // ) {
  //   return loaders.blogTagsLoader.load(blog?.id);
  // }

  @ResolveField(() => Boolean)
  async liked(@Parent() blog: Blog, @CurrentUser() user: User) {
    return await this.blogService.isLiked(blog.id, user?.id);
  }
}
