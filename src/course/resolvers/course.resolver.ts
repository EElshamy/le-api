import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Field,
  Float,
  ID,
  Int,
  Mutation,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import {
  GqlBooleanResponse,
  GqlStringArrayResponse
} from '@src/_common/graphql/graphql-response.type';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { CartService } from '@src/cart/services/cart.service';
import { Certification } from '@src/certification/certification.model';
import { CertificationService } from '@src/certification/certification.service';
import { RevenueShareService } from '@src/payment/services/revenue.service';
import { SearchSpaceEnum } from '@src/search/enums/search-space.enum';
import { GeneralSearchFilterInput } from '@src/search/inputs/search.input';
import { SearchResult } from '@src/search/interfaces/search-result.interface';
import { SearchService } from '@src/search/search.service';
import { UserInput } from '@src/user/inputs/users-board.filter';
import { UserService } from '@src/user/services/user.service';
import { GqlUsersResponse } from '@src/user/user.response';
import DataLoader from 'dataloader';
import { Sequelize } from 'sequelize';
import {
  SEQUELIZE_INSTANCE_NEST_DI_TOKEN,
  Transactional
} from 'sequelize-transactional-typescript';
import { IDataLoaders } from '../../_common/dataloader/dataloader.interface';
import { Auth } from '../../_common/decorators/auth.decorator';
import { Loader } from '../../_common/decorators/loader.decorator';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { NullablePaginatorInput } from '../../_common/paginator/paginator.input';
import { CurrentUser } from '../../auth/auth-user.decorator';
import { AuthGuard } from '../../auth/auth.guard';
import { HasPermission, HasRole } from '../../auth/auth.metadata';
import { Category } from '../../course-specs/category/category.model';
import { Skill } from '../../course-specs/skill/models/skill.model';
import { Tool } from '../../course-specs/tool/models/tool.model';
import { Review } from '../../reviews/review.model';
import { ReviewService } from '../../reviews/review.service';
import { User } from '../../user/models/user.model';
import { LangEnum, UserRoleEnum } from '../../user/user.enum';
import { CourseTypeEnum } from '../enums/course.enum';
import { CourseUserFilterArgs } from '../inputs/course-user-filter.input';
import { CourseUserSortArgs } from '../inputs/course-user-sort.input';
import { CourseInput } from '../inputs/course.input';
import { CancelPurchaseRequestInput } from '../inputs/create-cancel-purchase-request.input';
import {
  CreateCourseByAdminInput,
  CreateCourseByLecturerInput,
  CreateDraftedCourseByAdminInput
} from '../inputs/create-course.input';
import {
  CoursesBoardByAdminFilterInput,
  CoursesBoardByLecturerFilterInput,
  CoursesBoardSortInput,
  CoursesSiteSort
} from '../inputs/filter-course.input';
import { LearningProgramFilterArgs } from '../inputs/Learning-program-filter.Input';
import { LearningProgramInput } from '../inputs/learning-program.input';
import {
  PublishDraftedCourseAdminInput,
  PublishDraftedCourseLecturerInput
} from '../inputs/publish-draft.input';
import { ReplyCourseRequest } from '../inputs/reply-course-request.input';
import {
  ExploreInput,
  SearchFilterInput,
  SearchSortInput
} from '../inputs/search.types';
import {
  UpdateCourseByAdminInput,
  UpdateCourseByLecturerInput
} from '../inputs/update-course.input';
import { userLearningProgramFilterArgs } from '../inputs/user-learning-program.filter.input';
import { UserLearningProgramSortArgs } from '../inputs/user-learning-program.sort.input';
import {
  GqlCertifiedProgramsResponse,
  GqlCompletedResponse,
  GqlCourseResponse,
  GqlCoursesResponse,
  GqlCoursesWithoutPaginationResponse,
  GqlNumberResponse
} from '../interfaces/course.response';
import { UserCourseProgress } from '../interfaces/course.type';
import {
  GqlCousesAndDiplomasPaginatdResponse,
  GqlCousesAndDiplomasResponse
} from '../interfaces/courses-and-diplomas.resopnse';
import {
  GqlLearningProgramsExploreResponse,
  GqlLearningProgramsForCategoryResponse,
  LearningProgramsForCategory
} from '../interfaces/learning-programs-explore.response';
import { UserAssignedCoursesLoader } from '../loaders/user-assigned-courses.loader';
import { CourseDetail } from '../models/course-detail.model';
import { ChangeLog } from '../models/course-log.model';
import { Course } from '../models/course.model';
import { Lesson } from '../models/lesson.model';
import { Section } from '../models/section.model';
import { UsersAssignment } from '../models/user-assignments.model';
import { CourseService } from '../services/course.service';
import { LessonService } from '../services/lesson.service';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { GqlSiteMapResponse } from '@src/_common/graphql/site-map.resoponse';
import { CoursePermissionsEnum } from '@src/security-group/security-group-permissions';
import { QuizRelatedTypeEnum } from '@src/quiz/enum/quiz.enum';

@Resolver(() => Course)
export class CourseResolver {
  constructor(
    private readonly courseService: CourseService,
    private readonly userService: UserService,
    private readonly reviewService: ReviewService,
    private readonly searchService: SearchService,
    private readonly lessonService: LessonService,
    private readonly certificationService: CertificationService,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    private readonly cartService: CartService,
    private readonly revenueService: RevenueShareService,
    @Inject(Repositories.CertificationsRepository)
    private readonly certificationRepo: IRepository<Certification>,
    @Inject(Repositories.CategoriesRepository)
    private readonly categoryRepo: IRepository<Category>
    // @Inject(Repositories.QuizzesRepository)
    // private readonly quizRepo: IRepository<Quiz>
  ) {}

  //** --------------------- MUTATIONS --------------------- */
  //!deprecated
  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  async assignLearningProgramsToUser(
    @Args('userId') userId: string,
    @Args('learningPrograms', { type: () => [LearningProgramInput] })
    learningPrograms: LearningProgramInput[]
  ) {
    return await this.courseService.assignLearningProgramsToUser(
      {
        userId,
        learningPrograms
      },
      true,
      true,
      true
    );
  }

  @Auth({ allow: 'user' })
  @Mutation(() => GqlCourseResponse)
  async cancelPurchaseRequest(
    @Args('input') requestBody: CancelPurchaseRequestInput,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.courseService.cancelPurchaseRequest(
      currentUser,
      requestBody
    );
  }

  @Mutation(() => GqlCourseResponse)
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CoursePermissionsEnum.CREATE_COURSES)
  @Transactional()
  async createCourseByAdmin(@Args('input') input: CreateCourseByAdminInput) {
    return await this.courseService.createCourseByAdmin(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER)
  @Mutation(() => GqlCourseResponse)
  @Transactional()
  async createCourseByLecturer(
    @Args('input') input: CreateCourseByLecturerInput,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.courseService.createCourseByLecturer(input, currentUser);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlCourseResponse)
  @HasPermission(CoursePermissionsEnum.CREATE_COURSES)
  @Transactional()
  async createDraftedCourseByAdmin(
    @Args('input') input: CreateDraftedCourseByAdminInput
  ) {
    return await this.courseService.createDraftedCourseByAdmin(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER)
  @Mutation(() => GqlCourseResponse)
  @Transactional()
  async createDraftedCourseByLecturer(
    @Args('input') input: CreateDraftedCourseByAdminInput,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.courseService.createDraftedCourseByLecturer(
      input,
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlCourseResponse)
  @HasPermission(CoursePermissionsEnum.UPDATE_COURSES)
  // @Transactional()
  async publishDraftedCourseByAdmin(
    @Args('input') input: PublishDraftedCourseAdminInput
  ) {
    return await this.courseService.publishDraftedCourseByAdmin(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlCourseResponse)
  @HasPermission(CoursePermissionsEnum.CREATE_COURSES)
  @Transactional()
  async createPreviewCourseByAdmin(
    @Args('input') input: CreateDraftedCourseByAdminInput
  ) {
    return await this.courseService.createPreviewCourseByAdmin(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER)
  @Mutation(() => GqlCourseResponse)
  @Transactional()
  async createPreviewCourseByLecturer(
    @Args('input') input: CreateDraftedCourseByAdminInput,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.courseService.createPreviewCourseByLecturer(
      input,
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER)
  @Mutation(() => GqlCourseResponse)
  // @Transactional()
  async publishDraftedCourseByLecturer(
    @Args('input') input: PublishDraftedCourseLecturerInput,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.courseService.publishDraftedCourseByLecturer(
      input,
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlCourseResponse)
  @HasPermission(CoursePermissionsEnum.UPDATE_COURSES)
  @Transactional()
  async updateCourseBoardByAdmin(
    @Args('input') input: UpdateCourseByAdminInput,
    @CurrentUser() currentUser: User
  ) {
    return await this.courseService.updateCourseBoardByAdmin(
      input,
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER)
  @Mutation(() => GqlCourseResponse)
  @Transactional()
  async updateCourseBoardByLecturer(
    @Args('input') input: UpdateCourseByLecturerInput,
    @CurrentUser() currentUser: User
  ) {
    return await this.courseService.updateCourseBoardByLecturer(
      input,
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlCourseResponse)
  @HasPermission(CoursePermissionsEnum.UPDATE_COURSES)
  // @Transactional()
  async replyCourseRequest(@Args('input') input: ReplyCourseRequest) {
    return await this.courseService.replyCourseRequest(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Mutation(() => GqlBooleanResponse)
  @Transactional()
  async deleteCourse(
    @Args('courseId') id: string,
    @CurrentUser() currentUser: User
  ) {
    return await this.courseService.deleteCourse(id, currentUser);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  // @Transactional()
  async assignUsersToCourse(
    @Args('courseId') courseId: string,
    @Args('usersIds', { type: () => [String] }) userId: string[],
    @CurrentUser() currentUser: User
  ) {
    return await this.courseService.assignUsersToCourse(
      courseId,
      userId,
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  // @Transactional()
  async assingnLearningProgramsToUser(
    @Args('userId') userId: string,
    @Args('learningPrograms', { type: () => [LearningProgramInput] })
    learningPrograms: LearningProgramInput[]
  ) {
    return await this.courseService.assignLearningProgramsToUser(
      {
        userId,
        learningPrograms
      },
      true,
      true,
      true
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Transactional()
  async unassignUserFromCourse(
    @Args('courseId') courseId: string,
    @Args('usersIds', { type: () => [String] }) userIds: string[],
    @CurrentUser() currentUser: User
  ) {
    return await this.courseService.unassignUserFromCourse(
      courseId,
      userIds,
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Transactional()
  async markCourseAsCompleted(
    @Args('courseId') courseId: string,
    @Args('usersId') userId: string,
    @CurrentUser() currentUser: User
  ) {
    return await this.courseService.markCourseAsCompleted(
      courseId,
      userId || currentUser.id
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CoursePermissionsEnum.UPDATE_COURSES)
  @Transactional()
  async toggleCoursePublicationStatus(@Args('courseId') courseId: string) {
    return await this.courseService.toggleCoursePublicationStatus(courseId);
  }



  //** --------------------- QUERIES --------------------- */

  @Query(() => GqlCoursesWithoutPaginationResponse)
  async mostPopularCourses() {
    return await this.courseService.mostPopularCourses();
  }

  @Query(() => GqlLearningProgramsExploreResponse)
  async learningProgramsExplore(
    @Args()
    {
      sort,
      popularCoursesLimit,
      latestWorkshopsLimit,
      pathDiplomasLimit,
      subscriptionDiplomasLimit,
      liveCoursesLimit
    }: ExploreInput
  ) {
    return await this.courseService.learningProgramsExplore(
      sort,
      popularCoursesLimit,
      latestWorkshopsLimit,
      pathDiplomasLimit,
      subscriptionDiplomasLimit,
      liveCoursesLimit
    );
  }
  @Auth({ allow: 'user' })
  @UseGuards(AuthGuard)
  @Query(() => GqlCoursesResponse)
  async myCourses(
    @CurrentUser() currentUser: User,
    @Args() { filter }: CourseUserFilterArgs,
    @Args() { sort }: SearchSortInput,
    @Args() { paginate }: NullablePaginatorInput
  ) {
    return await this.courseService.myCourses(
      currentUser,
      filter,
      sort,
      paginate
    );
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlCoursesResponse)
  async myInProgress(
    @CurrentUser() currentUser: User,
    @Args() pagination: NullablePaginatorInput
  ): Promise<PaginationRes<Course>> {
    return await this.courseService.myInProgress(currentUser, pagination);
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlCompletedResponse)
  async myCompleted(
    @CurrentUser() currentUser: User,
    @Args() pagination: NullablePaginatorInput
  ) {
    const myCompleted = await this.courseService.myCompleted(
      currentUser,
      pagination
    );
    return myCompleted;
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlCertifiedProgramsResponse)
  async myCertifiedPrograms(
    @CurrentUser() currentUser: User,
    @Args() pagination: NullablePaginatorInput
  ) {
    const myCertifiedPrograms = await this.courseService.myCertifiedPrograms(
      currentUser,
      pagination
    );
    return myCertifiedPrograms;
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Query(() => GqlUsersResponse)
  async courseAssignedUsers(
    @Args('courseId') courseId: string,
    @Args() pagination: NullablePaginatorInput
  ) {
    return await this.courseService.courseAssignedUsers(
      courseId,
      pagination.paginate
    );
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlCoursesResponse)
  async search(
    @Args() filter: SearchFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: SearchSortInput
  ) {
    return await this.courseService.search(filter, paginate, sort);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CoursePermissionsEnum.READ_COURSES)
  @Query(() => GqlCoursesResponse)
  coursesBoardAdmin(
    @Args() filter: CoursesBoardByAdminFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: CoursesBoardSortInput,
    @Args('diplomaId', { nullable: true }) diplomaId: string
  ) {
    return this.courseService.coursesBoardAdmin(
      filter.filter,
      sort.sort,
      paginate.paginate
    );
  }

  @Query(() => GqlCoursesResponse)
  async courses(
    @Args() filter: GeneralSearchFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: CoursesSiteSort
  ) {
    return await this.courseService.courses(
      filter.filter,
      sort.sort,
      paginate.paginate
    );
  }

  @Query(() => GqlCoursesResponse)
  async privateCourses(
    @Args() filter: GeneralSearchFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: CoursesSiteSort,
    @CurrentUser() currentUser: User = null
  ) {
    return await this.courseService.privateCourses(
      filter.filter,
      sort.sort,
      paginate.paginate,
      currentUser
    );
  }

  @Query(() => GqlCoursesWithoutPaginationResponse)
  async recommendedCourses(
    @Args('courseId') id: string,
    @Args('courseType', { type: () => CourseTypeEnum })
    programType: CourseTypeEnum,
    @Args('isLive', {
      type: () => Boolean,
      nullable: true,
      defaultValue: false
    })
    isLive: boolean
  ) {
    return await this.courseService.recommendedCourses(id, programType, isLive);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER)
  @Query(() => GqlCoursesResponse)
  coursesBoardLecturer(
    @Args() filter: CoursesBoardByLecturerFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: CoursesBoardSortInput,
    @CurrentUser() currentUser: User
  ) {
    return this.courseService.coursesBoardLecturer(
      filter.filter,
      sort.sort,
      paginate.paginate,
      currentUser.lecturer.id
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlCourseResponse)
  courseBoardAdmin(@Args() { courseId }: CourseInput) {
    return this.courseService.courseBoardAdmin(courseId);
  }

  @Query(() => GqlCourseResponse)
  async course(
    @CurrentUser() user: User,
    @Args('courseId', { nullable: true }) id?: string,
    @Args('slug', { nullable: true }) slug?: string
  ) {
    const course = await this.courseService.courseOrError(id, null, slug);
    return await this.courseService.checkCourseAccess(course, user);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER, UserRoleEnum.ADMIN)
  @Query(() => GqlCourseResponse)
  courseBoardLecturer(
    @Args() { courseId }: CourseInput,
    @CurrentUser() currentUser: User
  ) {
    return this.courseService.courseBoardLecturer(courseId, currentUser);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER, UserRoleEnum.ADMIN)
  @Query(() => GqlUsersResponse)
  courseUsersBoard(
    @Args() { courseId }: CourseInput,
    @Args() courseUserFilterArgs: CourseUserFilterArgs,
    @Args() courseUserSortArgs: CourseUserSortArgs,
    @Args() pagination: NullablePaginatorInput
  ) {
    return this.courseService.courseUsersBoard(
      courseId,
      courseUserFilterArgs.filter,
      courseUserSortArgs.sort,
      pagination.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER, UserRoleEnum.ADMIN)
  @Query(() => GqlCourseResponse)
  courseInfoBoard(@Args() { courseId }: CourseInput) {
    return this.courseService.courseInfo(courseId);
  }

  @Query(() => GqlCourseResponse)
  async coursePreviewSite(
    @Args('courseId') id: string,
    @Args('userIdOfLecturer') userId: string
  ) {
    return this.courseService.coursePreviewSite(id, userId);
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlCoursesResponse)
  async userLearningProgramsBoard(
    @Args() input: UserInput,
    @Args() userLearningProgramFilterArgs: userLearningProgramFilterArgs,
    @Args() userLearningProgramSortArgs: UserLearningProgramSortArgs,
    @Args() pagination: NullablePaginatorInput
  ) {
    return await this.userService.userLearningPrograms(
      input.userId,
      userLearningProgramFilterArgs.filter,
      userLearningProgramSortArgs.sort,
      pagination.paginate
    );
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlCourseResponse)
  async insideCourseSallabusSite(
    @Args() input: CourseInput,
    @CurrentUser() currentUser: User
  ) {
    return await this.courseService.insideCourseSallabusSite(
      input.courseId,
      currentUser.id
    );
  }

  @Query(() => GqlCousesAndDiplomasResponse)
  async learningProgramsForAssigning(
    @Args() filter: LearningProgramFilterArgs
  ) {
    return this.courseService.learningProgramsForAssigning(filter.filter);
  }

  @Query(() => GqlCousesAndDiplomasPaginatdResponse)
  async learningProgramsForAssigningPaginated(
    @Args() filter: LearningProgramFilterArgs,
    @Args() paginate?: NullablePaginatorInput
  ) {
    return this.courseService.learningProgramsForAssigningPaginated(
      filter.filter,
      paginate?.paginate
    );
  }

  @Query(() => GqlSiteMapResponse)
  async coursesForSiteMap() {
    return await this.courseService.coursesForSiteMap();
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlNumberResponse)
  async getMaxLecturersCommissionPercentage(): Promise<number> {
    return await this.courseService.getMaxLecturersCommissionPercentage();
  }

  // @UseGuards(AuthGuard)
  // @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlLearningProgramsForCategoryResponse)
  async LearningProgramsByCategory(
    @Args('categoryId', { nullable: true }) id?: number,
    @Args('slug', { nullable: true }) slug?: string
  ): Promise<LearningProgramsForCategory> {
    let categoryId = id;

    if (!categoryId && !slug) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    if (!categoryId && slug) {
      const category = await this.categoryRepo.findOne({
        slug
      });
      if (!category) {
        throw new BaseHttpException(ErrorCodeEnum.CATEGORY_NOT_FOUND);
      }
      categoryId = category.id;
    }

    return await this.courseService.getLearningProgramsByCategoryId(categoryId);
  }

  @Query(() => GqlBooleanResponse)
  async createMissingSlugs(): Promise<Boolean> {
    await this.courseService.createMissingSlugs();
    return true;
  }

  //** ------------------ RESOLVE FIELDS ------------------ */

  //this resolve field is just for testing no need to make a loader for it
  @ResolveField(() => Number, { defaultValue: '0' })
  async numberOfAssignedUsers(@Parent() course: Course) {
    return (await this.courseService.courseAssignedUsers(course.id)).pageInfo
      .totalCount;
  }

  @ResolveField(() => Int, { nullable: true })
  priceAfterDiscount(@Parent() course: Course) {
    if (
      course.priceAfterDiscount >= 0 &&
      course.priceAfterDiscount !== course.originalPrice
    )
      return course.priceAfterDiscount;
    return null;
  }

  @ResolveField(() => [Certification], { nullable: true })
  async certifications(
    @Parent() course: Course,
    @CurrentUser() currentUser: User
  ) {
    if (!course?.id || !currentUser?.id) {
      return null;
    }

    return await this.certificationService.getCertificatesForCourse(
      course?.id,
      currentUser?.id
    );
  }

  @ResolveField(() => Boolean, { nullable: true })
  async isCompleted(
    @Parent() course: Course,
    @Loader(UserAssignedCoursesLoader)
    userAssignedCoursesLoader: DataLoader<any, any>,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser) return false;
    if (course['completed']) return course['completed'];

    const assignedCourse: UsersAssignment =
      await userAssignedCoursesLoader.load(course.id);

    return assignedCourse?.completed;
  }

  @ResolveField(() => Boolean, { nullable: true })
  async hasCertificate(
    @Parent() course: Course,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser) return false;
    const certificate = await this.certificationRepo.findOne({
      userId: currentUser.id,
      learningProgramId: course.id,
      learningProgramType: course.type
    });
    return !!certificate;
  }

  @ResolveField(() => Number, { nullable: true })
  async completedLessons(
    @Parent() course: Course,
    @Loader(UserAssignedCoursesLoader)
    userAssignedCoursesLoader: DataLoader<any, any>
  ) {
    if (course['completedLessons']) return course['completedLessons'];

    const assignedCourse: UsersAssignment =
      await userAssignedCoursesLoader.load(course.dataValues.id);

    return assignedCourse?.completedLessons;
  }

  @ResolveField(() => Number)
  async totalLessons(@Parent() course: Course) {
    return this.userService.getTotalLessonsForCourse(course.id);
  }

  // the lecturers users data
  @ResolveField(() => [User], { nullable: true })
  users(@Parent() course: Course, @Context('loaders') loaders: IDataLoaders) {
    // if (!course.lecturerId) return null;
    // return loaders.userByLecturerIdLoader.load(course.lecturerId);

    const users = loaders.usersByCourseIdLoader.load(course.id);
    if (!users) return null;
    return users;
  }

  @ResolveField(() => Review, { nullable: true })
  review(
    @Parent() course: Course,
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
    @CurrentUser() currentUser?: User
  ) {
    const resolvedUserId = userId || currentUser?.id;

    if (!resolvedUserId) {
      return null;
    }

    return this.reviewService.review(resolvedUserId, course.id);
  }
  // todo  refactor this .. in diploma module there is a loader for reviews
  @ResolveField(() => [Review], { nullable: 'itemsAndList' })
  reviews(@Parent() course: Course, @Context('loaders') loaders: IDataLoaders) {
    return loaders.reviewsLoader.load(course.id);
  }

  @ResolveField(() => CourseDetail)
  courseDetail(
    @Parent() course: Course,
    @Context('loaders') loaders: IDataLoaders
  ) {
    return loaders.courseDetailsLoader.load(course.id);
  }

  @ResolveField(() => Category, { nullable: true })
  category(
    @Parent() course: Course,
    @Context('loaders') loaders: IDataLoaders
  ) {
    if (!course.categoryId) {
      return null;
    }
    return loaders.categoryByIdsLoader.load(course.categoryId);
  }

  @ResolveField(() => [Tool], { nullable: 'itemsAndList' })
  tools(@Parent() course: Course, @Context('loaders') loaders: IDataLoaders) {
    return loaders.toolByCourseIdsLoader.load(course.id);
  }

  @ResolveField(() => [Skill], { nullable: 'itemsAndList' })
  skills(@Parent() course: Course, @Context('loaders') loaders: IDataLoaders) {
    return loaders.skillByCourseIdsLoader.load(course.id);
  }

  @ResolveField(() => [ChangeLog])
  changeLogs(
    @Parent() course: Course,
    @Context('loaders') loaders: IDataLoaders
  ) {
    return loaders.courseLogsLoader.load(course.id);
  }

  @ResolveField(() => [User], { nullable: true })
  async enrolledUser(
    @Parent() course: Course,
    @Context('loaders') loaders: IDataLoaders
  ) {
    const userIds = await this.courseService.courseUsers(course.id);
    if (!userIds) return null;
    return loaders.enrolledUserLoader.load(userIds.map(user => user.userId));
  }

  @UseGuards(AuthGuard)
  @ResolveField(() => UserCourseProgress, { nullable: true })
  async courseProgress(
    @Parent() course: Course,
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
    @CurrentUser() currentUser?: User
  ): Promise<UserCourseProgress> {
    const resolvedUserId = userId || currentUser?.id;

    if (!resolvedUserId) {
      return null;
    }

    return await this.userService.getUserCourseProgress(
      resolvedUserId,
      course.id
    );
  }

  @ResolveField(() => [SearchResult], { nullable: true })
  recommendedPrograms(@Parent() course: Course) {
    return this.searchService.recommendedPrograms(
      course.id,
      SearchSpaceEnum.COURSE,
      3
    );
  }

  @ResolveField(() => [Section], { nullable: true })
  courseSections(
    @Parent() course: Course,
    @Context('loaders') loaders: IDataLoaders
  ) {
    return loaders.courseSectionsLoader.load(course.id);
  }

  // @ResolveField(() => Review, { nullable: true })
  // reviews(@Parent() course: Course) {}

  @ResolveField(() => Boolean, { nullable: true })
  isEnrolled(
    @Parent() course: Course,
    @CurrentUser() currentUser: User = undefined
  ) {
    if (!course?.id || !currentUser?.id) return false;

    return this.courseService.isUserEnrolledInCourse(
      course.id,
      currentUser?.id
    );
  }

  @ResolveField(() => Lesson, { nullable: true })
  lastAccessedLesson(
    @Parent() course: Course,
    @CurrentUser() currentUser: User,
    @Args('userId', { nullable: true }) userId?: string
  ) {
    if (!currentUser && !userId) {
      return null;
    }
    return this.lessonService.getLastAccessedLesson(
      course.id,
      userId,
      currentUser
    );
  }

  @ResolveField(() => Boolean, { nullable: true })
  addedToCart(@Parent() course: Course, @CurrentUser() currentUser: User) {
    if (!currentUser) return false;
    return this.cartService.isAddedToCart(currentUser.id, course.id);
  }

  @ResolveField(() => MoneyScalar, { nullable: true })
  async systemProfit(@Parent() course: Course): Promise<number> {
    return (await this.revenueService.getCourseRevenue(course.id)).systemProfit;
  }

  @ResolveField(() => MoneyScalar, { nullable: true })
  async lecturerProfit(@Parent() course: Course): Promise<number> {
    return (await this.revenueService.getCourseRevenue(course.id))
      .lectureProfit;
  }

  @ResolveField(() => Int, { nullable: true })
  async commentsCount(@Parent() course: Course) {
    return this.courseService.courseCommentsCount(course.id);
  }

  @ResolveField(() => Boolean)
  assigned(@Parent() course: Course, @CurrentUser() currentUser?: User) {
    return this.courseService.assigned(course.id, currentUser?.id);
  }

  @ResolveField(() => CourseUnderDiplomaData, { nullable: true })
  async courseUnderDiplomaData(
    @Parent() course: Course,
    @Args('diplomaId', { nullable: true }) diplomaId: string
  ) {
    const res = await this.courseService.courseUndrerDiplomaData(
      diplomaId,
      course.id
    );
    return res;
  }

  @ResolveField(() => Date, {
    nullable: true,
    description: 'Subscription expiration date for the current user'
  })
  async subscriptionExpiresAt(
    @Parent() course: Course,
    @CurrentUser() currentUser: User,
    @Loader(UserAssignedCoursesLoader)
    userAssignedCoursesLoader: DataLoader<string, UsersAssignment | null>
  ): Promise<Date | null> {
    // user not logged in
    if (!currentUser) {
      return null;
    }

    const assignment = await userAssignedCoursesLoader.load(course.id);

    // not assigned or lifetime access
    if (!assignment || !assignment.accessExpiresAt) {
      return null;
    }

    return assignment.accessExpiresAt;
  }
  //** ------------------ RESOLVE FIELDS FOR LOCALIZATION----------------------**//
  @ResolveField(() => String, { nullable: true })
  title(@Parent() course: Course, @Context('lang') lang: LangEnum) {
    return course[`${lang.toLowerCase()}Title`] ?? course.arTitle;
  }
}
@ObjectType({
  description: 'data for course under certein diploma'
})
export class CourseUnderDiplomaData {
  @Field(() => Float, { nullable: true })
  commissionUnderDiploma: number;

  @Field(() => Float, { nullable: true })
  priceUnderDiploma: number;
}
