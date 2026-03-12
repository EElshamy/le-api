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
import { DeleteCategoryInput } from '@src/course-specs/category/inputs/delete-category.input';
import { IDataLoaders } from '../../_common/dataloader/dataloader.interface';
import { GqlBooleanResponse } from '../../_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '../../_common/paginator/paginator.input';
import { AuthGuard } from '../../auth/auth.guard';
import { HasPermission, HasRole } from '../../auth/auth.metadata';
import { CategoriesBlogsPermissionsEnum } from '../../security-group/security-group-permissions';
import { LangEnum, UserRoleEnum } from '../../user/user.enum';
import { BlogCategory } from './bLog-category.model';
import {
  GqlCategoriesPaginatedResponse,
  GqlCategoriesResponse,
  GqlCategoryResponse
} from './blog-category.response';
import { BlogCategoryService } from './blog-category.service';
import { BlogCategoriesFilterBoardInput } from './inputs/categories-filter.input';
import { CategoryInput } from './inputs/category.input';
import { BulkCreateBlogCategoryInput } from './inputs/create-category.input';
import { UpdateBlogCategoryInput } from './inputs/update-category.input';
import { GqlSiteMapResponse } from '@src/_common/graphql/site-map.resoponse';

@Resolver(() => BlogCategory)
export class BlogCategoryResolver {
  constructor(private readonly categoryService: BlogCategoryService) {}

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CategoriesBlogsPermissionsEnum.READ_CATEGORIES_BLOGS)
  @Query(returns => GqlCategoriesPaginatedResponse)
  async blogCategoriesBoard(
    @Args() filter: BlogCategoriesFilterBoardInput,
    @Args() sort: CategoriesBoardSortInput,
    @Args() paginate: NullablePaginatorInput
  ) {
    return await this.categoryService.categoriesBoard(
      filter.filter,
      sort.sort,
      paginate.paginate
    );
  }

  // @UseGuards(AuthGuard)
  // @HasRole(UserRoleEnum.ADMIN)
  // @HasPermission(CategoriesBlogsPermissionsEnum.READ_CATEGORIES_BLOGS)
  @Query(() => GqlCategoriesResponse)
  async activeBlogCategoriesListBoard() {
    return await this.categoryService.categoriesListBoard();
  }

  @Query(() => GqlCategoriesResponse)
  async blogCategories() {
    return await this.categoryService.categories();
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CategoriesBlogsPermissionsEnum.READ_CATEGORIES_BLOGS)
  @Query(returns => GqlCategoryResponse)
  async blogCategoryBoard(@Args() input: CategoryInput) {
    return await this.categoryService.categoryOrError(input.categoryId);
  }

  @Query(() => GqlSiteMapResponse)
  async blogCategoriesForSiteMap() {
    return await this.categoryService.blogCategoriesForSiteMap();
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CategoriesBlogsPermissionsEnum.CREATE_CATEGORIES_BLOGS)
  @Mutation(returns => GqlBooleanResponse)
  async createBlogCategoryBoard(@Args() input: BulkCreateBlogCategoryInput) {
    return await this.categoryService.createCategoryBoard(input.input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CategoriesBlogsPermissionsEnum.UPDATE_CATEGORIES_BLOGS)
  @Mutation(returns => GqlCategoryResponse)
  async updateBlogCategoryBoard(@Args('input') input: UpdateBlogCategoryInput) {
    return await this.categoryService.updateCategoryBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CategoriesBlogsPermissionsEnum.DELETE_CATEGORIES_BLOGS)
  @Mutation(returns => GqlBooleanResponse)
  async deleteBlogCategoryBoard(@Args('input') input: DeleteCategoryInput) {
    return await this.categoryService.deleteCategoryBoard(
      input.categoryId,
      input.reassignToCategoryId
    );
  }

  @ResolveField(() => String)
  localizedName(@Parent() category, @Context('lang') lang: LangEnum) {
    return category[`${lang.toLowerCase()}Name`] ?? category.arName;
  }

  @ResolveField(type => Boolean, { nullable: true })
  canBeDeleted(
    @Parent() category: BlogCategory,
    @Context('loaders') loaders: IDataLoaders
  ) {
    console.log('blog', category.id);
    return loaders?.canBlogCategoryBeDeletedLoader?.load(category.id);
  }
}
