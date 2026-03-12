import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import {
  CourseStatusEnum,
  PublicationStatusEnum
} from '@src/course/enums/course.enum';
import { GqlProgramsResponse } from '@src/course/interfaces/course.response';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { RevenueShareService } from '@src/payment/services/revenue.service';
import { WalletService } from '@src/payment/services/wallet.service';
import { IDataLoaders } from '../../_common/dataloader/dataloader.interface';
import { GqlContext } from '../../_common/graphql/graphql-context.type';
import {
  GqlBooleanResponse,
  GqlStringResponse
} from '../../_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '../../_common/paginator/paginator.input';
import { AllowTemporaryToken } from '../../auth/allow-temp-token.guard';
import { CurrentUser } from '../../auth/auth-user.decorator';
import { AuthGuard } from '../../auth/auth.guard';
import { HasPermission, HasRole } from '../../auth/auth.metadata';
import { FieldOfTraining } from '../../field-of-training/field-of-training.model';
import { JobTitle } from '../../job-title/job-title.model';
import { LecturerPermissionEnum } from '../../security-group/security-group-permissions';
import { User } from '../../user/models/user.model';
import { LangEnum, UserRoleEnum } from '../../user/user.enum';
import { GqlUserResponse, GqlUsersResponse } from '../../user/user.response';
import { CompleteLecturerProfileInput } from '../inputs/complete-lecturer-profile.input';
import { CreateLecturerBoardInput } from '../inputs/create-lecturer-board.input';
import { LecturerUserIdOrCodeBoardInput } from '../inputs/lecturer-board.input';
import { LecturerLerningProgramSortArgs as LecturerLearningProgramSortArgs } from '../inputs/lecturer-learnin-program-sort.input';
import { LecturerLearningProgramFilterArgs } from '../inputs/lecturer-learning-program-filter.input';
import {
  LecturerIdInput,
  LecturerUserIdInput
} from '../inputs/lecturer-userId.input';
import {
  LecturersBoardFilterInput,
  LecturersBoardSortInput
} from '../inputs/lecturers-board.input';
import { SetLecturerPasswordInput } from '../inputs/set-lecturer-password.input';
import { UpdateLecturerBoardInput } from '../inputs/update-lecturer-board.input';
import { UpdateLecturerPasswordBoard } from '../inputs/update-lecturer-password.board';
import { UpdateLecturerProfileInput } from '../inputs/update-lecturer-profile.input';
import { Lecturer } from '../models/lecturer.model';
import { LecturerLearningProgram } from '../objectTypes/learningProgram.type';
import {
  GqLecturerResponse,
  GqLecturersPaginatedResponse
} from '../responses/lecturer.response';
import { LecturerService } from '../services/lecturer.service';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { LecturerCommissionUnderCourse } from '../interfaces/lecturer.type';

@Resolver(() => Lecturer)
export class LecturerResolver {
  constructor(
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    private readonly lecturerService: LecturerService,
    private readonly revenueShareService: RevenueShareService,
    private readonly walletService: WalletService
  ) {}

  //** --------------------- QUERIES --------------------- */

  @UseGuards(AuthGuard)
  @HasPermission(LecturerPermissionEnum.READ_LECTURER)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlUsersResponse)
  async lecturersBoard(
    @Args() paginateInput: NullablePaginatorInput,
    @Args() filter: LecturersBoardFilterInput,
    @Args() sort: LecturersBoardSortInput
  ): Promise<PaginationRes<User>> {
    return await this.lecturerService.lecturersBoard(
      paginateInput.paginate,
      filter.filter,
      sort.sort
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlUserResponse)
  @HasPermission(LecturerPermissionEnum.READ_LECTURER)
  async lecturerBoard(@Args() input: LecturerUserIdOrCodeBoardInput) {
    return await this.lecturerService.lecturerBoard(input);
  }

  @Query(() => GqLecturersPaginatedResponse)
  async lecturers(
    @Args() paginateInput: NullablePaginatorInput,
    @Args() filter: LecturersBoardFilterInput,
    @Args() sort: LecturersBoardSortInput
  ) {
    return await this.lecturerService.lecturers(
      paginateInput.paginate,
      filter.filter,
      sort.sort
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlStringResponse)
  async exportLecturers(
    @Args('id', { type: () => String, nullable: true }) id: string
  ): Promise<string> {
    return await this.lecturerService.exportLecturers(id);
  }

  @Query(() => GqLecturerResponse)
  async lecturer(
    @Args('lecturerId', { nullable: true }) lecturerId?: string,
    @Args('slug', { nullable: true }) slug?: string
  ) {
    return await this.lecturerService.lecturer(lecturerId, slug);
  }
  
  @UseGuards(AuthGuard)
  @Query(() => GqlProgramsResponse)
  async lecturerLearningProgramsBoard(
    @Args('input') input: LecturerIdInput,
    @Args()
    lecturerLearningProgramFilterArgs: LecturerLearningProgramFilterArgs,
    @Args() lecturerLearningProgramSortArgs: LecturerLearningProgramSortArgs,
    @Args() pagination: NullablePaginatorInput
  ): Promise<PaginationRes<LecturerLearningProgram>> {
    return await this.lecturerService.lecturerLearningProgramsUnion(
      input,
      lecturerLearningProgramFilterArgs.filter,
      lecturerLearningProgramSortArgs.sort,
      pagination.paginate
    );
  }

  //** --------------------- MUTATIONS --------------------- */

  @UseGuards(AllowTemporaryToken(AuthGuard))
  @Mutation(() => GqlBooleanResponse)
  @HasRole(UserRoleEnum.LECTURER)
  async setLecturerPassword(
    @Args('input') input: SetLecturerPasswordInput,
    @Context() { sessionId, currentUser }: GqlContext
  ) {
    return await this.lecturerService.setLecturerPassword(
      input,
      currentUser,
      sessionId
    );
  }

  @UseGuards(AllowTemporaryToken(AuthGuard))
  @Query(() => GqlBooleanResponse)
  @HasRole(UserRoleEnum.LECTURER)
  async isValidPasswordResetSession(
    @Context() { sessionId, currentUser }: GqlContext
  ) {
    return await this.lecturerService.isValidPasswordResetUrl(
      currentUser,
      sessionId
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerPermissionEnum.UPDATE_LECTURER)
  async resendLecturerPasswordGenerationEmail(
    @Args() input: LecturerUserIdInput
  ) {
    return await this.lecturerService.resendLecturerPasswordGenerationEmail(
      input.userIdOfLecturer
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasRole(UserRoleEnum.LECTURER)
  async completeLecturerProfile(
    @Args('input') input: CompleteLecturerProfileInput,
    @CurrentUser() currentUser: User
  ) {
    return await this.lecturerService.completeLecturerProfile(
      input,
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerPermissionEnum.CREATE_LECTURER)
  async createLecturerBoard(@Args('input') input: CreateLecturerBoardInput) {
    return await this.lecturerService.createLecturerBoard(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerPermissionEnum.UPDATE_LECTURER)
  async updateLecturerBoard(@Args('input') input: UpdateLecturerBoardInput) {
    return await this.lecturerService.updateLecturerBoard(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasRole(UserRoleEnum.LECTURER)
  async updateLecturerProfile(
    @Args('input') input: UpdateLecturerProfileInput,
    @CurrentUser() currentUser: User
  ) {
    return await this.lecturerService.updateLecturerProfile(input, currentUser);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerPermissionEnum.UPDATE_LECTURER)
  async updateLecturerPasswordBoard(
    @Args('input') input: UpdateLecturerPasswordBoard
  ) {
    return await this.lecturerService.updateLecturerPasswordBoard(input);
  }

  //** --------------------- DATALOADER --------------------- */

  @ResolveField(() => JobTitle, { nullable: true })
  async jobTitle(
    @Parent() lecturer: Lecturer,
    @Context('loaders') loaders: IDataLoaders
  ): Promise<JobTitle | null> {
    if (!lecturer.jobTitleId) return null;
    return loaders.jobTitleLoader.load(lecturer.jobTitleId);
  }

  @ResolveField(() => [FieldOfTraining])
  async fieldOfTrainings(
    @Parent() lecturer: Lecturer,
    @Context('loaders') loaders: IDataLoaders
  ): Promise<FieldOfTraining[]> {
    return loaders.lecturerFieldOfTrainingLoader.load(lecturer.id);
  }

  @ResolveField(() => [Course], {
    nullable: true
  })
  async courses(@Parent() lecturer: Lecturer): Promise<Course[]> {
    const courses = await this.courseRepo.findAll(
      {
        status: CourseStatusEnum.APPROVED,
        publicationStatus: PublicationStatusEnum.PUBLIC
      },
      [
        {
          model: CourseLecturer,
          required: true,
          where: {
            lecturerId: lecturer.id
          }
        }
      ],
      null
    );

    return courses;
  }

  @ResolveField(() => [Diploma])
  async diplomas(@Parent() lecturer: Lecturer): Promise<Diploma[]> {
    return await this.lecturerService.getDiplomasByLectureId(lecturer.id);
  }

  @ResolveField(() => User)
  async user(
    @Parent() lecturer: Lecturer,
    @Context('loaders') loaders: IDataLoaders
  ): Promise<User> {
    if (!lecturer.userId) return null;
    return loaders.userLoader.load(lecturer.userId);
  }

  @ResolveField(() => MoneyScalar)
  async revenue(@Parent() lecturer: Lecturer): Promise<number> {
    return (
      (await this.revenueShareService.getLecturerTotalRevenue(lecturer.id)) ?? 0
    );
  }

  @ResolveField(() => MoneyScalar)
  async balance(@Parent() lecturer: Lecturer): Promise<number> {
    return (await this.walletService.getLecturerBalance(lecturer.id)) ?? 0;
  }

  @ResolveField(() => String, { nullable: true })
  async bio(
    @Parent() lecturer: Lecturer,
    @Context('lang') lang: LangEnum
  ): Promise<string> {
    return lecturer[`${lang.toLowerCase()}Bio`] ?? lecturer.enBio;
  }

  @ResolveField(() => LecturerCommissionUnderCourse, { nullable: true })
  async commissionUnderCourse(
    @Parent() lecturer: Lecturer,
    @Args('courseId', { type: () => ID, nullable: true }) courseId: string
  ): Promise<LecturerCommissionUnderCourse> {
    if (!courseId) return null;
    return await this.lecturerService.commissionUnderCourse(
      lecturer.id,
      courseId
    );
  }

  @ResolveField(() => String, { nullable: true })
  async bankName(
    @Parent() lecturer: Lecturer,
    @CurrentUser() currentUser: User
  ): Promise<string | null> {
    if (!currentUser || !lecturer.bankName) return null;

    const isOwner = lecturer.userId === currentUser.id;
    const isAdmin = currentUser.role === UserRoleEnum.ADMIN;

    return isOwner || isAdmin ? lecturer.bankName : '************';
  }

  @ResolveField(() => String, { nullable: true })
  async bankIBAN(
    @Parent() lecturer: Lecturer,
    @CurrentUser() currentUser: User
  ): Promise<string | null> {
    if (!currentUser || !lecturer.bankIBAN) return null;

    const isOwner = lecturer.userId === currentUser.id;
    const isAdmin = currentUser.role === UserRoleEnum.ADMIN;

    return isOwner || isAdmin ? lecturer.bankIBAN : '************';
  }

  @ResolveField(() => String, { nullable: true })
  async bankAccountNumber(
    @Parent() lecturer: Lecturer,
    @CurrentUser() currentUser: User
  ): Promise<string | null> {
    if (!currentUser || !lecturer.bankAccountNumber) return null;

    const isOwner = lecturer.userId === currentUser.id;
    const isAdmin = currentUser.role === UserRoleEnum.ADMIN;

    return isOwner || isAdmin ? lecturer.bankAccountNumber : '************';
  }

  @ResolveField(() => String, { nullable: true })
  async vodafoneCashNumber(
    @Parent() lecturer: Lecturer,
    @CurrentUser() currentUser: User
  ): Promise<string | null> {
    if (!currentUser || !lecturer.vodafoneCashNumber) return null;

    const isOwner = lecturer.userId === currentUser.id;
    const isAdmin = currentUser.role === UserRoleEnum.ADMIN;

    return isOwner || isAdmin ? lecturer.vodafoneCashNumber : '************';
  }
}
