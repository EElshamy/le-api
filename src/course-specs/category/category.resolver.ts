import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { IDataLoaders } from '../../_common/dataloader/dataloader.interface';
import { GqlBooleanResponse } from '../../_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '../../_common/paginator/paginator.input';
import { HasPermission, HasRole } from '../../auth/auth.metadata';
import { CategoriesLearningProgramsPermissionsEnum } from '../../security-group/security-group-permissions';
import { LangEnum, UserRoleEnum } from '../../user/user.enum';
import { Category } from './category.model';
import {
  GqlCategoriesArrayResponse,
  GqlCategoriesResponse,
  GqlCategoryResponse
} from './category.response';
import { CategoryService } from './category.service';
import {
  CategoriesBoardFilterInput,
  CategoriesBoardSortInput
} from './inputs/categories-board.input';
import { CategoryInput } from './inputs/category.input';
import {
  BulkCreateCategoryInput,
  CreateCategoryInput
} from './inputs/create-category.input';
import { DeleteCategoryInput } from './inputs/delete-category.input';
import { UpdateCategoryInput } from './inputs/update-category.input';
import { UseGuards } from '@nestjs/common';
import { GqlSiteMapResponse } from '@src/_common/graphql/site-map.resoponse';
import { AuthGuard } from '@src/auth/auth.guard';

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}
  //** ---------------------  QUERIES  --------------------- */
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(
    CategoriesLearningProgramsPermissionsEnum.READ_CATEGORIES_LEARNING_PROGRAMS
  )
  @Query(() => GqlCategoriesResponse)
  async categoriesBoard(
    @Args() filter: CategoriesBoardFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: CategoriesBoardSortInput
  ) {
    return await this.categoryService.categoriesBoard(
      filter.filter,
      sort.sort,
      paginate.paginate
    );
  }

  @Query(() => GqlCategoriesResponse)
  async activeCategories(@Args() paginate: NullablePaginatorInput) {
    return await this.categoryService.activeCategories(paginate.paginate);
  }

  @UseGuards(AuthGuard)
  @HasPermission(
    CategoriesLearningProgramsPermissionsEnum.READ_CATEGORIES_LEARNING_PROGRAMS
  )
  @Query(() => GqlCategoryResponse)
  async categoryBoard(@Args() { categoryId }: CategoryInput) {
    return await this.categoryService.categoryOrError(categoryId);
  }

  //! TODO: this must be special view of the categories
  @Query(() => GqlCategoriesResponse)
  async categories(
    @Args() filter: CategoriesBoardFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: CategoriesBoardSortInput
  ) {
    return await this.categoryService.categoriesBoard(
      filter.filter,
      sort.sort,
      paginate.paginate
    );
  }

  //! TODO: this must be special view of the categories
  @Query(() => GqlCategoryResponse)
  async category(@Args() input: CategoryInput) {
    return await this.categoryService.categoryOrError(
      input?.categoryId,
      input?.slug
    );
  }

  @Query(() => GqlSiteMapResponse)
  async categoriesForSiteMap() {
    return await this.categoryService.categoriesForSiteMap();
  }

  //** --------------------- MUTATIONS --------------------- */
  @UseGuards(AuthGuard)
  @HasPermission(
    CategoriesLearningProgramsPermissionsEnum.DELETE_CATEGORIES_LEARNING_PROGRAMS
  )
  @Mutation(() => GqlBooleanResponse)
  async deleteCategoryBoard(@Args('input') input: DeleteCategoryInput) {
    return await this.categoryService.deleteCategoryBoard(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlCategoryResponse)
  @HasPermission(
    CategoriesLearningProgramsPermissionsEnum.UPDATE_CATEGORIES_LEARNING_PROGRAMS
  )
  async updateCategoryBoard(@Args('input') input: UpdateCategoryInput) {
    return await this.categoryService.updateCategoryBoard(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlCategoryResponse)
  @HasPermission(
    CategoriesLearningProgramsPermissionsEnum.CREATE_CATEGORIES_LEARNING_PROGRAMS
  )
  async createCategoryBoard(@Args('input') input: CreateCategoryInput) {
    return await this.categoryService.createCategoryBoard(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlCategoriesArrayResponse)
  @HasPermission(
    CategoriesLearningProgramsPermissionsEnum.CREATE_CATEGORIES_LEARNING_PROGRAMS
  )
  async bulkCreateCategoryBoard(@Args() input: BulkCreateCategoryInput) {
    return await this.categoryService.bulkCreateCategoryBoard(input.input);
  }

  //** ------------------ RESOLVE FIELDS ------------------ */

  @ResolveField(() => String)
  localizedName(@Parent() category: Category, @Context('lang') lang: LangEnum) {
    return category[`${lang.toLowerCase()}Name`] ?? category.arName;
  }
  @ResolveField(() => Boolean)
  canBeDeleted(
    @Parent() category: Category,
    @Context('loaders') loaders: IDataLoaders
  ) {
    return loaders.canCategoryBeDeletedLoader.load(category.id);
  }
}
