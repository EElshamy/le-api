import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { Loader } from '@src/_common/decorators/loader.decorator';
import {
  generateGqlResponseType,
  GqlBooleanResponse,
  GqlStringArrayResponse
} from '@src/_common/graphql/graphql-response.type';
import { AuthGuard } from '@src/auth/auth.guard';
import { Category } from '@src/course-specs/category/category.model';
import { Skill } from '@src/course-specs/skill/models/skill.model';
import { Tool } from '@src/course-specs/tool/models/tool.model';
import { DiplomaService } from './diploma.service';
import {
  CreateDiplomaInput,
  PublishDraftedDiplomaInput
} from './inputs/create-diploma.input';

import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { PublicationStatusEnum } from '@src/course/enums/course.enum';
import { GqlCoursesResponse } from '@src/course/interfaces/course.response';
import { Course } from '@src/course/models/course.model';
import { CourseService } from '@src/course/services/course.service';
import { RevenueShareService } from '@src/payment/services/revenue.service';
import { Review } from '@src/reviews/review.model';
import { User } from '@src/user/models/user.model';
import { LangEnum, UserRoleEnum } from '@src/user/user.enum';
import {
  GqlUsersNotPaginatedResponse,
  GqlUsersResponse
} from '@src/user/user.response';
import { Transactional } from 'sequelize-transactional-typescript';
import { AssignUsersToDiplomaInput } from './inputs/assign-user-to-diploma.input';
import { CreateDraftedDiplomaInput } from './inputs/create-diploma.input';
import { DiplomaProgramsInput } from './inputs/diploma-programs.input';
import {
  DiplomaProgramsBoardFilterInput,
  DiplomaProgramsSortInput,
  DiplomasBoardSortInput,
  diplomasSiteFilterArgs,
  DiplomaUsersBoardFilterInput,
  DiplomaUsersBoardSortInput,
  GeneralFilterDiplomaInput
} from './inputs/filter-diploma.input';
import { LecturerDiplomasBoardFilter } from './inputs/lecturer-diplomas-board.input';
import { UpdateDiplomaInput } from './inputs/update-diploma.input';
import { GqlUsersAssignedDiplomaProgressType } from './inputs/user-assigned-diploma-progress-type';
import { UserProgressResponse } from './inputs/user-progress.response';
import { DiplomaCategoryLoader } from './loaders/diploma-category.loader';
import { DiplomaLecturersLoader } from './loaders/diploma-lecturers.loader';
import { DiplomaSkillsLoader } from './loaders/diploma-skills.loader';
import { DiplomaToolsLoader } from './loaders/diploma-tools.loader';
import { DiplomaUsersLoader } from './loaders/diploma-users.loader';
import { DiplomaDetail } from './models/diploma-detail.model';
import { Diploma } from './models/diploma.model';
import { Logs } from './models/logs.model';
import {
  UserProgress,
  userProgressByPrograms
} from './outputs/users-progress.response';
import { coursesAndWorkshopsCountOutput } from './types/calculate-prices-under-diloma';
import { CartService } from '@src/cart/services/cart.service';
import { Certification } from '@src/certification/certification.model';
import {
  LearningProgramTypeEnum,
  UpperCaseLearningProgramTypeEnum
} from '@src/cart/enums/cart.enums';
import { GqlSiteMapResponse } from '@src/_common/graphql/site-map.resoponse';
import { DiplomaPermissionsEnum } from '@src/security-group/security-group-permissions';
import { QuizRelatedTypeEnum } from '@src/quiz/enum/quiz.enum';
import { RecommendedDiplomasFilterInput } from './inputs/recommended-diplomas-filter.input';
import { DiplomaAnalytics } from './types/diploma-analytics.type';
import { GqlDiplomaCourseAnalyticsPaginatedResponse } from './outputs/diploma-courses-analytics.response';

const GqlDiplomaResponse = generateGqlResponseType(Diploma);
const GqlDiplomaChangeLogs = generateGqlResponseType([Logs], true);
const GqlDiplomasPaginatedResponse = generateGqlResponseType([Diploma]);
export const GqlDiplomasNonPaginatedResponse = generateGqlResponseType(
  [Diploma],
  true
);
const GqlUserProgressResponse = generateGqlResponseType(UserProgressResponse);

@Resolver(() => Diploma)
export class DiplomaResolver {
  constructor(
    private readonly diplomaService: DiplomaService,
    private readonly courseService: CourseService,
    private readonly cartService: CartService,
    @Inject(Repositories.DiplomaDetailsRepository)
    private readonly diplomaDetailsRepo: IRepository<DiplomaDetail>,
    @Inject(Repositories.CertificationsRepository)
    private readonly certificationRepo: IRepository<Certification>,
    private readonly revenueService: RevenueShareService
  ) {}

  // ******************************** Mutations *********************************** //
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlDiplomaResponse)
  @HasPermission(DiplomaPermissionsEnum.CREATE_DIPLOMAS)
  @Transactional()
  async createDraftedDiploma(
    @Args('input') input?: CreateDraftedDiplomaInput
  ): Promise<Diploma> {
    return this.diplomaService.createDiploma(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlDiplomaResponse)
  @HasPermission(DiplomaPermissionsEnum.CREATE_DIPLOMAS)
  // @Transactional()
  async createPublishedDiploma(
    @Args('input') input?: CreateDiplomaInput
  ): Promise<Diploma> {
    return this.diplomaService.createPublishedDiploma(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlDiplomaResponse)
  @HasPermission(DiplomaPermissionsEnum.UPDATE_DIPLOMAS)
  // @Transactional()
  async publishDraftedDiploma(
    @Args('input') input?: PublishDraftedDiplomaInput
  ): Promise<Diploma> {
    return this.diplomaService.publishDraftedDiploma(input);
  }
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlDiplomaResponse)
  @HasPermission(DiplomaPermissionsEnum.UPDATE_DIPLOMAS)
  @Transactional()
  async updateDiploma(
    @Args('input') input?: UpdateDiplomaInput,
    @CurrentUser() currentUser?: User
  ): Promise<Diploma> {
    const diploma = await this.diplomaService.updateDiploma(input, currentUser);
    return diploma;
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(DiplomaPermissionsEnum.DELETE_DIPLOMAS)
  @Mutation(() => GqlBooleanResponse)
  @Transactional()
  async deleteDiploma(@Args('diplomaId') diplomaId?: string): Promise<number> {
    return this.diplomaService.deleteDiploma(diplomaId);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(DiplomaPermissionsEnum.CREATE_DIPLOMAS)
  @Mutation(() => GqlDiplomaResponse)
  @Transactional()
  async createDiplomaPreview(
    @Args('input') input?: CreateDraftedDiplomaInput
  ): Promise<Diploma> {
    return this.diplomaService.createDiplomaPreview(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlBooleanResponse)
  // @Transactional()
  async assignUsersToDiploma(
    @Args('input') input: AssignUsersToDiplomaInput
  ): Promise<boolean> {
    return this.diplomaService.assignUsersToDiploma(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlBooleanResponse)
  @Transactional()
  async unassignUsersFromDiploma(
    @Args('input') input: AssignUsersToDiplomaInput
  ): Promise<boolean> {
    return this.diplomaService.unassignUsersFromDiploma(input);
  }

  @Mutation(() => GqlDiplomaResponse)
  async toggleDiplomaPublicationStatus(
    @Args('diplomaId') diplomaId: string
  ): Promise<Diploma> {
    return await this.diplomaService.toggleDiplomaPublicationStatus(diplomaId);
  }

  @Mutation(() => GqlBooleanResponse)
  async setProgramsPublicationStatusToPublic(
    @Args('ids', { type: () => [String] }) ids: string[]
  ): Promise<boolean> {
    return await this.diplomaService.setProgramsPublicationStatusToPublic(ids);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlBooleanResponse)
  @Transactional()
  async updateProgramUsersCounts(): Promise<boolean> {
    return await this.diplomaService.updateProgramUsersCounts();
  }

  // ******************************** Queries ************************************** //
  @Query(() => GqlDiplomaResponse)
  async diploma(
    @Args('diplomaId', { nullable: true }) diplomaId?: string,
    @Args('slug', { nullable: true }) slug?: string,
    @Args('publicationStatus', {
      nullable: true,
      type: () => PublicationStatusEnum
    })
    publicationStatus?: PublicationStatusEnum
  ): Promise<Diploma> {
    return await this.diplomaService.diploma(
      diplomaId,
      slug,
      publicationStatus
    );
  }

  //@UseGuards(AuthGuard)
  @Query(() => GqlCoursesResponse)
  async diplomaPrograms(
    @Args('input') input: DiplomaProgramsInput,
    @Args() sort?: DiplomaProgramsSortInput,
    @Args() filter?: DiplomaProgramsBoardFilterInput,
    @Args() pagination?: NullablePaginatorInput,
    @CurrentUser() currentUser?: User
  ): Promise<any> {
    return await this.diplomaService.diplomaPrograms(
      input,
      pagination.paginate,
      sort,
      filter,
      currentUser
    );
  }

  @Query(() => GqlCoursesResponse)
  async diplomaCourses(
    @Args('diplomaId') diplomaId: string,
    @Args() pagination?: NullablePaginatorInput
  ): Promise<PaginationRes<Course>> {
    return await this.diplomaService.diplomaCourses(diplomaId, pagination);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(DiplomaPermissionsEnum.READ_DIPLOMAS)
  @Query(() => GqlDiplomasPaginatedResponse)
  async diplomasBoard(
    @Args() filter?: GeneralFilterDiplomaInput,
    @Args() paginator?: NullablePaginatorInput,
    @Args() sort?: DiplomasBoardSortInput
  ): Promise<PaginationRes<Diploma>> {
    return await this.diplomaService.diplomasBoard(
      filter.filter,
      sort,
      paginator.paginate
    );
  }

  //@UseGuards(AuthGuard)
  @Query(() => GqlDiplomasPaginatedResponse)
  async diplomasSite(
    @Args() filter?: diplomasSiteFilterArgs,
    @Args() paginator?: NullablePaginatorInput,
    @Args() sort?: DiplomasBoardSortInput
  ): Promise<PaginationRes<Diploma>> {
    return this.diplomaService.diplomasSite(
      filter.filter,
      sort,
      paginator.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER)
  @Query(() => GqlDiplomasPaginatedResponse)
  async lecturerDiplomasBoard(
    @Args() filter: LecturerDiplomasBoardFilter,
    @Args() sort?: DiplomasBoardSortInput,
    @Args() paginator: NullablePaginatorInput = {},
    @CurrentUser() currentUser?: User
  ): Promise<PaginationRes<Diploma>> {
    return this.diplomaService.lecturerDiplomasBoard(
      filter?.filter,
      sort,
      paginator,
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlDiplomaChangeLogs)
  async diplomaChangeLogs(
    @Args('diplomaId') diplomaId: string
  ): Promise<Logs[]> {
    return this.diplomaService.diplomaChangeLogs(diplomaId);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Query(() => GqlUsersAssignedDiplomaProgressType)
  async usersAssignedDiploma(
    @Args('diplomaId') diplomaId: string,
    @Args({ nullable: true }) sort?: DiplomaUsersBoardSortInput,
    @Args({ nullable: true }) paginator?: NullablePaginatorInput,
    @Args({ nullable: true }) filter?: DiplomaUsersBoardFilterInput
  ) {
    const result = await this.diplomaService.usersAssignedDiploma(
      diplomaId,
      sort,
      paginator.paginate,
      filter.filter
    );
    return result;
  }

  //@UseGuards(AuthGuard)
  @Query(() => GqlDiplomasNonPaginatedResponse)
  async diplomasWhereCourseIsPartOf(
    @Args('courseId') courseId: string
  ): Promise<Diploma[]> {
    return this.diplomaService.diplomasWhereCourseIsPartOf(courseId);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Query(() => GqlUserProgressResponse)
  async userProgressInDiploma(
    @Args('userId') userId: string,
    @Args('diplomaId') diplomaId: string
  ): Promise<{
    completedLessons: number;
    totalLessons: number;
  }> {
    return await this.diplomaService.getUserCompletedLessonsForDiploma(
      diplomaId,
      userId
    );
  }

  @Query(() => GqlDiplomasNonPaginatedResponse)
  async recommendedDiplomas(
    @Args('diplomaId') diplomaId: string,
    @Args('filter', { nullable: true })
    filter?: RecommendedDiplomasFilterInput
  ): Promise<Diploma[]> {
    return await this.diplomaService.recommendedDiplomas(diplomaId, filter);
  }

  @Query(() => GqlUsersResponse)
  async usersForDiplomaAssignments(
    @Args('diplomaId') diplomaId: string,
    @Args('searchKey', { nullable: true }) searchKey?: string,
    @Args() paginator?: NullablePaginatorInput
  ): Promise<PaginationRes<User>> {
    return await this.diplomaService.usersForDiplomaAssignment(
      diplomaId,
      searchKey,
      paginator
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(DiplomaPermissionsEnum.READ_DIPLOMAS)
  @Query(() => GqlDiplomaCourseAnalyticsPaginatedResponse)
  async diplomaCoursesAnalytics(
    @Args('diplomaId') diplomaId: string,
    @Args() pagination?: NullablePaginatorInput
  ): Promise<PaginationRes<DiplomaAnalytics>> {
    return this.diplomaService.getDiplomaCoursesAnalytics(
      diplomaId,
      pagination?.paginate
    );
  }

  @Query(() => GqlSiteMapResponse)
  async diplomasForSiteMap() {
    return await this.diplomaService.diplomasForSiteMap();
  }

  // ******************************** Resolve Fields ******************************** //

  @ResolveField(() => userProgressByPrograms)
  async progress(
    @Parent() { id }: Diploma,
    @CurrentUser('id') currentUserId?: string
  ): Promise<userProgressByPrograms> {
    return this.diplomaService.userProgressByPrograms(id, currentUserId);
  }

  @ResolveField(() => DiplomaDetail)
  async diplomaDetails(@Parent() { id }: Diploma): Promise<DiplomaDetail> {
    const diplomaDetails = await this.diplomaDetailsRepo.findOne({
      diplomaId: id
    });
    /**
     * this diploma details counts will have the public and private programs so we should
     * find the diploma public courses and workshops to recalculate the counts before return the diploma details
     */
    return this.diplomaService.recalculateDiplomaCounts(diplomaDetails);
  }

  @ResolveField(() => [UserProgress], { nullable: true })
  async users(
    @Parent() diploma: Diploma,
    @Loader(DiplomaUsersLoader) DiplomaUsersLoader
  ): Promise<any> {
    // return DiplomaUsersLoader.load(diploma.id);
    return null;
  }

  @ResolveField(() => [User], { nullable: 'itemsAndList' })
  async lecturers(
    @Parent() diploma: Diploma,
    @Loader(DiplomaLecturersLoader) diplomaLecturersLoader
  ): Promise<User[]> {
    return diplomaLecturersLoader.load(diploma.id) || [];
  }

  @ResolveField(() => [Course])
  async programs(
    @Parent() diploma: Diploma,
    // @Loader(DiplomaProgramsLoader) diplomaProgramsLoader,
    @Args('publicationStatus', {
      nullable: true,
      type: () => PublicationStatusEnum
    })
    publicationStatus: PublicationStatusEnum
  ): Promise<Course[]> {
    // return diplomaProgramsLoader.load(diploma.id);
    return await this.courseService.getCoursesForDiploma(
      diploma.id,
      publicationStatus
    );
  }

  @ResolveField(() => Category, { nullable: true })
  category(
    @Parent() diploma: Diploma,
    @Loader(DiplomaCategoryLoader) diplomaCategoryLoader
  ): Promise<any> {
    if (diploma.categoryId) {
      return diplomaCategoryLoader.load(diploma.categoryId);
    }
  }

  @ResolveField(() => [Tool], { nullable: 'itemsAndList' })
  tools(
    @Parent() diploma: Diploma,
    @Loader(DiplomaToolsLoader) diplomaToolsLoader
  ) {
    return diplomaToolsLoader.load(diploma.id);
  }

  @ResolveField(() => [Skill], { nullable: 'itemsAndList' })
  skills(
    @Parent() diploma: Diploma,
    @Loader(DiplomaSkillsLoader) diplomaSkillsLoader
  ) {
    return diplomaSkillsLoader.load(diploma.id);
  }

  @ResolveField(() => Boolean, { defaultValue: false })
  assigned(
    @Parent() diploma: Diploma,
    @CurrentUser() currentUser?: User
  ): Promise<boolean> {
    return this.diplomaService.assigned(diploma?.id, currentUser?.id);
  }
  @ResolveField(() => Boolean, { defaultValue: false })
  async isAddedToCart(
    @Parent() diploma: Diploma,
    @CurrentUser() currentUser?: User
  ): Promise<boolean> {
    return await this.cartService.isAddedToCart(currentUser?.id, diploma?.id);
  }

  @ResolveField(() => coursesAndWorkshopsCountOutput, { defaultValue: 0 })
  async coursesAndWorkshopsCount(
    @Parent() diploma: Diploma,
    @CurrentUser() currentUser?: User
  ): Promise<coursesAndWorkshopsCountOutput> {
    const res = await this.diplomaService.coursesAndWorkshopsCount(
      diploma,
      currentUser
    );

    return res;
  }

  @ResolveField(() => [Review], { nullable: true })
  async reviews(@Parent() diploma: Diploma): Promise<Review[]> {
    return this.diplomaService.diplomaReviews(diploma.id);
  }

  @ResolveField(() => MoneyScalar, { nullable: true })
  async lecturerProfit(@Parent() diploma: Diploma): Promise<number> {
    return (await this.revenueService.getDiplomaRevenue(diploma.id))
      .lectureProfit;
  }

  @ResolveField(() => MoneyScalar, { nullable: true })
  async systemProfit(@Parent() diploma: Diploma): Promise<number> {
    return (await this.revenueService.getDiplomaRevenue(diploma.id))
      .systemProfit;
  }

  // //todo use this data loader for reviews in diploma and courses
  // @ResolveField(() => [Review], { nullable: true })
  // async reviews(
  //   @Parent() diploma: Diploma,
  //   @Loader(ProgramReviewsLoader) diplomaReviewsLoader
  // ) {
  //   return diplomaReviewsLoader.load(diploma.id);
  // }
  @ResolveField(() => String)
  title(@Parent() diploma: Diploma, @Context('lang') lang: LangEnum): any {
    return diploma[`${lang.toLowerCase()}Title`] ?? diploma.arTitle;
  }

  @ResolveField(() => Certification, { nullable: true })
  async myCertification(
    @Parent() diploma: Diploma,
    @CurrentUser() currentUser: User
  ): Promise<Certification> {
    if (!currentUser) {
      return null;
    }
    return await this.certificationRepo.findOne({
      userId: currentUser?.id,
      learningProgramId: diploma.id,
      learningProgramType: UpperCaseLearningProgramTypeEnum.DIPLOMA
    });
  }
}
