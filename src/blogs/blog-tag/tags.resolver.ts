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
import { CategoriesBoardSortInput } from '@src/course-specs/category/inputs/categories-board.input';
import { GqlBooleanResponse } from '../../_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '../../_common/paginator/paginator.input';
import { AuthGuard } from '../../auth/auth.guard';
import { HasPermission, HasRole } from '../../auth/auth.metadata';
import {
  BlogPermissionsEnum,
  BlogTagsPermissionEnum
} from '../../security-group/security-group-permissions';
import { LangEnum, UserRoleEnum } from '../../user/user.enum';
import {
  GqlTagResponse,
  GqlTagsPaginatedResponse,
  GqlTagsResponse
} from './blog-tag.response';
import { BlogTagsFilterBoardInput } from './inputs/blog-tag.filter.input';
import { BulkCreateTagInput } from './inputs/create-blog-tag.input';
import { TagInput } from './inputs/tag.input';
import { UpdateTagInput } from './inputs/update-tag.input';
import { Tag } from './tag.model';
import { BlogTagService } from './tags.service';
import { GqlSiteMapResponse } from '@src/_common/graphql/site-map.resoponse';

@Resolver(() => Tag)
export class BlogTagResolver {
  constructor(private readonly blogTagService: BlogTagService) {}

  // ******************** Queries ******************** //

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogTagsPermissionEnum.READ_BLOG_TAGS)
  @Query(returns => GqlTagsPaginatedResponse)
  async blogTagsBoard(
    @Args() filter: BlogTagsFilterBoardInput,
    @Args() sort: CategoriesBoardSortInput,
    @Args() paginate: NullablePaginatorInput
  ) {
    return await this.blogTagService.tagsBoard(
      filter.filter,
      sort.sort,
      paginate.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogTagsPermissionEnum.READ_BLOG_TAGS)
  @Query(() => GqlTagsResponse)
  async activeBlogTagsBoard() {
    return await this.blogTagService.tags();
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogTagsPermissionEnum.READ_BLOG_TAGS)
  @Query(returns => GqlTagResponse)
  async blogTagBoard(@Args() input: TagInput) {
    return await this.blogTagService.tagOrError(input.tagId);
  }

  @Query(() => GqlSiteMapResponse)
  async blogTagsForSiteMap() {
    return await this.blogTagService.blogTagsForSiteMap();
  }

  // ******************** Mutations ******************** //

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogTagsPermissionEnum.CREATE_BLOG_TAGS)
  @Mutation(returns => GqlBooleanResponse)
  async createTagBoard(@Args() input: BulkCreateTagInput) {
    return await this.blogTagService.createTagBoard(input.input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogTagsPermissionEnum.CREATE_BLOG_TAGS)
  @Mutation(returns => GqlTagResponse)
  async updateTagBoard(@Args('input') input: UpdateTagInput) {
    return await this.blogTagService.updateTagBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(BlogTagsPermissionEnum.DELETE_BLOG_TAGS)
  @Mutation(returns => GqlBooleanResponse)
  async deleteTagBoard(@Args() input: TagInput) {
    return await this.blogTagService.deleteTagBoard(input.tagId);
  }

  @ResolveField(() => String)
  localizedName(@Parent() tag, @Context('lang') lang: LangEnum) {
    return tag[`${lang.toLowerCase()}Name`] ?? tag.arName;
  }
}
