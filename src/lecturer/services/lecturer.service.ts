import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UpperCaseLearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { Category } from '@src/course-specs/category/category.model';
import { CourseDetail } from '@src/course/models/course-detail.model';
import { Course } from '@src/course/models/course.model';
import { DiplomaStatusEnum } from '@src/diploma/enums/diploma-status.enum';
import { DiplomaCourses } from '@src/diploma/models/diploma-course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import {
  Includeable,
  Op,
  Order,
  QueryTypes,
  Sequelize,
  Transaction,
  WhereOptions
} from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import * as uuid from 'uuid';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { MailService } from '../../_common/mail/mail.service';
import { IMailService } from '../../_common/mail/mail.type';
import { PaginatorInput } from '../../_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '../../_common/paginator/paginator.types';
import { UploaderService } from '../../_common/uploader/uploader.service';
import { HelperService } from '../../_common/utils/helper.service';
import { CodePrefix } from '../../_common/utils/helpers.enum';
import { RegisterAsLecturerInput } from '../../auth/inputs/register-as-lecturer.input';
import { FieldOfTrainingService } from '../../field-of-training/field-of-training.service';
import { JobTitleService } from '../../job-title/job-title.service';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/services/user.service';
import { UserRoleEnum } from '../../user/user.enum';
import {
  ApprovalStatusEnum,
  LecturersBoardSortEnum
} from '../enums/lecturer.enum';
import { CompleteLecturerProfileInput } from '../inputs/complete-lecturer-profile.input';
import { CreateLecturerBoardInput } from '../inputs/create-lecturer-board.input';
import { LecturerUserIdOrCodeBoardInput } from '../inputs/lecturer-board.input';
import {
  LecturerLerningProgramSortEnum,
  LecturerLerningProgramSortInput
} from '../inputs/lecturer-learnin-program-sort.input';
import { LecturerLearningProgramFilterInput } from '../inputs/lecturer-learning-program-filter.input';
import { LecturerIdInput } from '../inputs/lecturer-userId.input';
import {
  LecturersBoardFilter,
  LecturersBoardSort
} from '../inputs/lecturers-board.input';
import { SetLecturerPasswordInput } from '../inputs/set-lecturer-password.input';
import { UpdateLecturerBoardInput } from '../inputs/update-lecturer-board.input';
import { UpdateLecturerPasswordBoard } from '../inputs/update-lecturer-password.board';
import { UpdateLecturerProfileInput } from '../inputs/update-lecturer-profile.input';
import { Lecturer } from '../models/lecturer.model';
import { LecturerRequest } from '../models/lecturer.request.model';
import { LecturerLearningProgram } from '../objectTypes/learningProgram.type';
import { FieldOfTraining } from '@src/field-of-training/field-of-training.model';
import { JobTitle } from '@src/job-title/job-title.model';
import { parse } from 'json2csv';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { PublicationStatusEnum } from '@src/course/enums/course.enum';
import { UserPasswordHistory } from '@src/user/models/user-password-history.model';

@Injectable()
export class LecturerService {
  constructor(
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    @Inject(Repositories.LecturerRequestsRepository)
    private readonly lecturerRequestRepo: IRepository<LecturerRequest>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(Repositories.CoursesRepository)
    private readonly coursesRepo: IRepository<Course>,
    @Inject(Repositories.DiplomaCoursesRepository)
    private readonly diplomaCoursesRepo: IRepository<DiplomaCourses>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomasRepo: IRepository<Diploma>,
    @Inject(Repositories.CourseLecturersRepository)
    private readonly courseLecturersRepo: IRepository<CourseLecturer>,
    @Inject(Repositories.UserPasswordHistoriesRepository)
    private readonly userPasswordHistoryRepo: IRepository<UserPasswordHistory>,
    // ..
    @Inject(MailService) private readonly mailService: IMailService,
    private readonly jobTitleService: JobTitleService,
    private readonly fieldOfTrainingService: FieldOfTrainingService,
    private readonly uploaderService: UploaderService,
    private readonly helperService: HelperService,
    private readonly userService: UserService,
    private readonly configService: ConfigService
  ) {}

  async createLecturerRelatedInfoAfterRegister(
    input: RegisterAsLecturerInput
  ): Promise<void> {
    const lecturer = await this.lecturerRepo.createOne(
      { ...input },
      input.transaction
    );

    await this.validateJobTitleAndFieldofTraining(
      lecturer,
      input.jobTitleId,
      input.fieldOfTrainingIds,
      input.transaction
    );

    await this.lecturerRequestRepo.createOne(
      { lecturerId: lecturer.id, ...input },
      input.transaction
    );

    await this.setLecturerUploadedFilesReferences(lecturer, input.transaction);
  }

  async validateJobTitleAndFieldofTraining(
    lecturer: Lecturer,
    jobTitleId: string,
    fieldOfTrainingIds: string[],
    transaction: Transaction
  ): Promise<void> {
    if (jobTitleId)
      await this.jobTitleService.jobTitleForLecturerRegisterationOrError(
        jobTitleId
      );
    if (fieldOfTrainingIds?.length)
      await this.fieldOfTrainingService.setLecturerFieldOfTraining(
        lecturer,
        fieldOfTrainingIds,
        transaction
      );
  }

  async setLecturerUploadedFilesReferences(
    lecturer: Lecturer,
    transaction: Transaction
  ) {
    await this.uploaderService.setUploadedFilesReferences(
      [lecturer.cvUrl],
      'Lecturer',
      'cvUrl',
      lecturer.id,
      transaction
    );
  }

  async completeLecturerProfile(
    input: CompleteLecturerProfileInput,
    currentUser: User
  ) {
    if (currentUser.lecturer.hasCompletedProfile)
      throw new BaseHttpException(
        ErrorCodeEnum.LECTURER_PROFILE_ALREADY_COMPLETED
      );

    if (currentUser.lecturer.status !== ApprovalStatusEnum.APPROVED)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_NOT_APPROVED);

    return await this.sequelize.transaction(async transaction => {
      const user = await this.userRepo.updateOne(
        { id: currentUser.id },
        { ...input },
        transaction
      );
      await this.lecturerRepo.updateOne(
        { id: currentUser.lecturer.id },
        { ...input, hasCompletedProfile: true },
        transaction
      );
      await this.setUserUploadedFilesReferences(user, transaction);
      return user;
    });
  }

  async setUserUploadedFilesReferences(user: User, transaction: Transaction) {
    await this.uploaderService.setUploadedFilesReferences(
      [user.profilePicture],
      'User',
      'profilePicture',
      user.id,
      transaction
    );
  }

  async resendLecturerPasswordGenerationEmail(userId: string) {
    const lecturerUser = await this.userRepo.findOne({ id: userId }, [
      Lecturer
    ]);
    if (lecturerUser.password)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_PASSWORD_ALREADY_SET);
    if (lecturerUser.lecturer.status !== ApprovalStatusEnum.APPROVED)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_NOT_APPROVED);

    const tempToken = await this.generateLecturerPasswordResetToken(userId);
    await this.sendLecturerEmailByStatus(
      lecturerUser.lecturer.status,
      lecturerUser.email,
      lecturerUser.enFullName.split(' ')[0]
    );
    return true;
  }

  async generateLecturerPasswordResetToken(userId: string) {
    const sessionId = uuid.v4();
    const tempToken = this.helperService.generateAuthToken({
      userId,
      expiresIn: '24h',
      sessionId
    });
    await this.userRepo.updateOne(
      { id: userId },
      { passwordResetSessionId: sessionId }
    );
    return tempToken;
  }

  async sendLecturerEmailByStatus(
    status: ApprovalStatusEnum,
    lecturerEmail: string,
    lecturerName: string,
    rejectionReason?: string
  ) {
    if (status === ApprovalStatusEnum.APPROVED) {
      await this.mailService.send({
        to: lecturerEmail,
        template: 'lecturer-approved',
        subject: 'Welcome to Leiaqa!',
        templateData: {
          url: 'https://instructor.leiaqa.com/',
          lecturerName: lecturerName
        }
      });
    } else {
      await this.mailService.send({
        to: lecturerEmail,
        template: 'request-rejection',
        subject: 'Important Update on Your Instructor Application',
        templateData: {
          lecturerName: lecturerName,
          rejectionReason: rejectionReason
        }
      });
    }
  }

  isValidPasswordResetUrl(currentUser: User, sessionId: string) {
    if (currentUser.password)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_PASSWORD_ALREADY_SET);

    if (currentUser.lecturer.status !== ApprovalStatusEnum.APPROVED)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_NOT_APPROVED);

    if (sessionId !== currentUser.passwordResetSessionId)
      throw new BaseHttpException(ErrorCodeEnum.PASSWORD_RESET_LINK_EXPIRED);

    return true;
  }

  async setLecturerPassword(
    input: SetLecturerPasswordInput,
    currentUser: User,
    sessionId: string
  ) {
    this.isValidPasswordResetUrl(currentUser, sessionId);
    await this.userRepo.updateOne(
      { id: currentUser.id },
      {
        password: await this.helperService.hashPassword(input.password),
        passwordResetSessionId: null
      }
    );

    return true;
  }

  async lecturersBoard(
    paginate: PaginatorInput = {},
    filter: LecturersBoardFilter = {},
    sort: LecturersBoardSort = {
      sortBy: LecturersBoardSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    }
  ): Promise<PaginationRes<User>> {
    return await this.userRepo.findPaginated(
      {
        ...(filter.activeOnly && {
          isBlocked: false,
          isDeleted: false,
          '$lecturer.hasCompletedProfile$': true
        }),
        ...(filter.searchKey && {
          [Op.or]: [
            {
              arFullName: {
                [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
              }
            },
            {
              enFullName: {
                [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
              }
            },
            {
              email: {
                [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
              }
            },
            {
              code: {
                [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
              }
            },
            {
              phone: {
                [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
              }
            }
          ]
        })
      },
      this.sortLecturersBoard(sort),
      paginate.page,
      paginate.limit,
      [
        {
          model: Lecturer,
          attributes: [],
          required: true,
          where: { status: ApprovalStatusEnum.APPROVED }
        }
      ]
    );
  }

  async lecturerBoard(input: LecturerUserIdOrCodeBoardInput) {
    if (!input.code && !input.userIdOfLecturer && !input.lecturerId) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    let lecturerUserId: string | null = null;

    if (input.userIdOfLecturer) {
      lecturerUserId = input.userIdOfLecturer;
    } else if (input.code) {
      const lecturerByCode = await this.userRepo.findOne({
        code: input.code,
        role: UserRoleEnum.LECTURER
      });
      if (!lecturerByCode) {
        throw new BaseHttpException(ErrorCodeEnum.LECTURER_DOESNT_EXIST);
      }
      lecturerUserId = lecturerByCode.id;
    } else if (input.lecturerId) {
      const lecturerEntity = await this.lecturerRepo.findOne(
        {
          id: input.lecturerId
        },
        [
          {
            model: User
          }
        ]
      );
      if (!lecturerEntity) {
        throw new BaseHttpException(ErrorCodeEnum.LECTURER_DOESNT_EXIST);
      }
      lecturerUserId = lecturerEntity.userId;
    }

    const lecturer = await this.userRepo.findOne({
      id: lecturerUserId,
      role: UserRoleEnum.LECTURER
    });

    if (!lecturer) {
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_DOESNT_EXIST);
    }

    return lecturer;
  }

  async lecturers(
    paginate: PaginatorInput = {},
    filter: LecturersBoardFilter = {},
    sort: LecturersBoardSort = {
      sortBy: LecturersBoardSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    }
  ) {
    return await this.lecturerRepo.findPaginated(
      {
        status: ApprovalStatusEnum.APPROVED,
        hasCompletedProfile: true
      },
      this.sortLectuers(sort),
      paginate.page || 1,
      paginate.limit || 15,
      [
        {
          model: User,
          as: 'user',
          where: {
            role: UserRoleEnum.LECTURER,
            isBlocked: false,
            isDeleted: false,
            ...(filter.searchKey && {
              [Op.or]: [
                {
                  arFullName: {
                    [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
                  }
                },
                {
                  enFullName: {
                    [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
                  }
                },
                {
                  email: {
                    [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
                  }
                }
              ]
            })
          }
        }
      ]
    );
  }

  async lecturer(lecturerId?: string, slug?: string) {
    if (!lecturerId && !slug) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    const where: WhereOptions<Lecturer> = lecturerId ? { id: lecturerId } : {};

    const include: Includeable[] = [
      {
        model: User,
        as: 'user',
        where: slug ? { slug } : undefined
      },
      {
        model: CourseLecturer,
        include: [{ model: Course }]
      }
    ];

    const lecturer = await this.lecturerRepo.findOne(where, include);

    if (!lecturer) {
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_DOESNT_EXIST);
    }

    return lecturer;
  }

  async createLecturerBoard(input: CreateLecturerBoardInput) {
    await this.userService.deleteRejectedLecturersWithTheSameEmailOrPhone(
      input.email,
      input.phone
    );
    await this.userService.errorIfUserWithEmailExistsForRegisteration(
      input.email
    );
    await this.userService.deleteDuplicatedUsersAtNotVerifiedEmail(input.email);

    await this.userService.deleteDuplicatedUsersAtPhonesIfEmailNotVerifiedYet(
      input.phone
    );
    await this.userService.errorIfUserWithPhoneExists(input.phone);

    await this.jobTitleService.jobTitleForLecturerRegisterationOrError(
      input.jobTitleId
    );

    const user = await this.sequelize.transaction(async transaction => {
      const user = await this.userRepo.createOne(
        {
          ...input,
          role: UserRoleEnum.LECTURER,
          requireChangePassword: true,
          code: await this.helperService.generateModelCodeWithPrefix(
            CodePrefix.LECTURER,
            this.userRepo
          ),
          firstName: input.enFullName.split(' ')[0],
          lastName: input.enFullName.split(' ')[1],
          password: await this.helperService.hashPassword(input.password)
        },
        transaction
      );

      await this.userPasswordHistoryRepo.createOne({
        userId: user.id,
        password: user.password,
        changedAt: new Date()
      });
      const lecturer = await this.lecturerRepo.createOne(
        {
          ...input,
          userId: user.id,
          status: ApprovalStatusEnum.APPROVED,
          hasCompletedProfile: true
        },
        transaction
      );

      await this.validateJobTitleAndFieldofTraining(
        lecturer,
        null,
        input.fieldOfTrainingIds,
        transaction
      );
      await this.setUserUploadedFilesReferences(user, transaction);
      return user;
    });

    const tempToken = await this.generateLecturerPasswordResetToken(user.id);
    await this.sendLecturerEmailByStatus(
      ApprovalStatusEnum.APPROVED,
      user.email,
      user.enFullName.split(' ')[0]
    );
    return user;
  }

  async updateLecturerBoard(input: UpdateLecturerBoardInput) {
    let lecturerUser = await this.findLecturerByUserIdOrError(
      input.userIdOfLecturer
    );

    if (lecturerUser.lecturer.status !== ApprovalStatusEnum.APPROVED)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_NOT_APPROVED);

    await this.userService.validateIfOtherUserHasEmailOrPhoneAndDeleteDuplicates(
      input.email,
      input.phone,
      input.userIdOfLecturer
    );

    return await this.sequelize.transaction(async transaction => {
      await this.validateJobTitleAndFieldofTraining(
        lecturerUser.lecturer,
        input.jobTitleId,
        input.fieldOfTrainingIds,
        transaction
      );

      await this.lecturerRepo.updateOneFromExistingModel(
        lecturerUser.lecturer,
        { ...input },
        transaction
      );
      lecturerUser = await this.userRepo.updateOneFromExistingModel(
        lecturerUser,
        await this.updateLecturerBoardTransformer(input, lecturerUser),
        transaction
      );

      if (input.cvUrl && input.cvUrl) {
        await this.setLecturerUploadedFilesReferences(
          lecturerUser.lecturer,
          transaction
        );
      }
      if (input.profilePicture) {
        await this.setUserUploadedFilesReferences(lecturerUser, transaction);
      }
      return lecturerUser;
    });
  }

  async updateLecturerBoardTransformer(
    input: UpdateLecturerBoardInput,
    lecturerUser: User
  ) {
    return {
      ...input,

      ...(input.password && {
        password: await this.helperService.hashPassword(input.password)
      }),

      profilePicture: input.profilePicture ?? lecturerUser.profilePicture
    };
  }

  async findLecturerByUserIdOrError(userIdOfLecturer: string) {
    const lecturerUser = await this.userRepo.findOne({ id: userIdOfLecturer }, [
      Lecturer
    ]);

    if (!lecturerUser || lecturerUser.role !== UserRoleEnum.LECTURER)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_DOESNT_EXIST);

    return lecturerUser;
  }

  async validateLecturerForCourseCreation(userIdOfLecturer: string) {
    const lecturerUser =
      await this.findLecturerByUserIdOrError(userIdOfLecturer);
    if (lecturerUser.isBlocked)
      throw new BaseHttpException(ErrorCodeEnum.BLOCKED_USER);
    if (lecturerUser.isDeleted)
      throw new BaseHttpException(ErrorCodeEnum.USER_DELETED);
    if (!lecturerUser.lecturer.hasCompletedProfile)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_PROFILE_NOT_COMPLETED);
    if (lecturerUser.lecturer.status !== ApprovalStatusEnum.APPROVED)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_NOT_APPROVED);
    return lecturerUser;
  }

  async updateLecturerPasswordBoard(input: UpdateLecturerPasswordBoard) {
    const lecturerUser = await this.findLecturerByUserIdOrError(
      input.userIdOfLecturer
    );

    if (!lecturerUser.password)
      throw new BaseHttpException(ErrorCodeEnum.CANNOT_CHANGE_PASSWORD);

    await this.userRepo.updateOneFromExistingModel(lecturerUser, {
      password: await this.helperService.hashPassword(input.password)
    });
  }

  // sort in the user model
  private sortLecturersBoard(sort: LecturersBoardSort): Order {
    if (sort.sortBy === LecturersBoardSortEnum.REVENUE) return [];
    return [[sort.sortBy, sort.sortType]];
  }

  // sort in the lecturer model
  private sortLectuers(sort: LecturersBoardSort): Order {
    if (sort.sortBy === LecturersBoardSortEnum.REVENUE) return [];
    if (sort.sortBy === LecturersBoardSortEnum.LAST_ACTIVE) {
      return [[{ model: User, as: 'user' }, 'lastActiveAt', sort.sortType]];
    }

    return [[sort.sortBy, sort.sortType]];
  }

  async updateLecturerProfile(
    input: UpdateLecturerProfileInput,
    currentUser: User
  ) {
    let lecturerUser = await this.findLecturerByUserIdOrError(currentUser.id);

    await this.userService.validateIfOtherUserHasEmailOrPhoneAndDeleteDuplicates(
      null,
      input.phone,
      currentUser.id
    );

    return await this.sequelize.transaction(async transaction => {
      await this.validateJobTitleAndFieldofTraining(
        lecturerUser.lecturer,
        input.jobTitleId,
        input.fieldOfTrainingIds,
        transaction
      );

      await this.lecturerRepo.updateOneFromExistingModel(
        lecturerUser.lecturer,
        { ...input },
        transaction
      );

      lecturerUser = await this.userRepo.updateOneFromExistingModel(
        lecturerUser,
        { ...input },
        transaction
      );

      if (input.profilePicture) {
        await this.setUserUploadedFilesReferences(lecturerUser, transaction);
      }

      return lecturerUser;
    });
  }

  // TODO: remove this when fron handle lecturerLearningProgramsUnion
  async lecturerLearningPrograms(
    input: LecturerIdInput,
    filter: LecturerLearningProgramFilterInput,
    sort: LecturerLerningProgramSortInput = {
      sortBy: LecturerLerningProgramSortEnum.UPDATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = { page: 1, limit: 10 }
  ) {
    const sortOptions = [
      ...(sort.sortBy === LecturerLerningProgramSortEnum.JOINED ?
        [['courseDetail', 'enrolledUsersCount', sort.sortType]]
      : [[sort.sortBy, sort.sortType]])
    ];

    const courses = await this.courseRepo.findPaginated(
      {
        // TODO: handle this
        // lecturerId: input.lecturerId,
        ...(filter?.categoryIds && {
          categoryId: { [Op.in]: filter.categoryIds }
        }),
        ...(filter?.status && { status: filter.status }),
        ...(filter?.type && { type: filter.type }),
        ...(filter?.visibility && { publicationStatus: filter.visibility }),
        ...(filter?.searchKey && {
          [Op.or]: [{ enTitle: { [Op.iLike]: `%${filter.searchKey}%` } }]
        })
      },
      sortOptions,
      paginate.page,
      paginate.limit,
      [
        // Lecturer,
        Category,
        { model: CourseDetail, as: 'courseDetail' },
        { model: CourseLecturer, where: { lecturerId: input.lecturerId } }
      ]
    );

    if (!courses) {
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_DOESNT_EXIST);
    }

    return courses;
  }

  async lecturerLearningProgramsUnion(
    input: LecturerIdInput,
    filter: LecturerLearningProgramFilterInput,
    sort: LecturerLerningProgramSortInput = {
      sortBy: LecturerLerningProgramSortEnum.UPDATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = { page: 1, limit: 10 }
  ): Promise<PaginationRes<LecturerLearningProgram>> {
    const { page, limit } = paginate;

    // Validation for lecturerId
    if (!input.lecturerId) {
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_DOESNT_EXIST);
    }

    const replacements: Record<string, any> = {
      lecturerId: input.lecturerId,
      categoryIds: filter?.categoryIds,
      status: filter?.status,
      visibility: filter?.visibility,
      searchKey: filter?.searchKey ? `%${filter.searchKey}%` : undefined,
      limit,
      offset: (page - 1) * limit
    };

    const baseQuery = this.buildBaseQuery(filter, replacements);
    const sortByField = this.getSortByField(sort);

    const finalQuery = `
      SELECT DISTINCT ON ("id", "type") *
      FROM (
        ${baseQuery}
      ) AS "programs"
      ORDER BY "id", "type", ${sortByField} ${sort.sortType}
      LIMIT :limit OFFSET :offset
    `;

    try {
      const programs = await this.executeMainQuery(finalQuery, replacements);

      const countQuery = this.getCountQuery(baseQuery);
      const [{ totalCount }] = await this.executeCountQuery(
        countQuery,
        replacements
      );

      return this.formatResponse(programs, page, limit, totalCount);
    } catch (err) {
      console.error(err);
      throw new BaseHttpException(ErrorCodeEnum.DATABASE_ERROR);
    }
  }

  // Helper methods for cleaner code

  private buildBaseQuery(
    filter: LecturerLearningProgramFilterInput,
    replacements: Record<string, any>
  ): string {
    if (
      filter?.type === UpperCaseLearningProgramTypeEnum.COURSE ||
      filter?.type === UpperCaseLearningProgramTypeEnum.WORKSHOP
    ) {
      return this.getCoursesQuery(filter, replacements);
    }

    if (filter?.type === UpperCaseLearningProgramTypeEnum.DIPLOMA) {
      return this.getDiplomasQuery(filter, replacements);
    }

    return this.getCoursesAndDiplomasQuery(filter, replacements);
  }

  private getCoursesQuery(
    filter: LecturerLearningProgramFilterInput,
    replacements: Record<string, any>
  ): string {
    return `
      SELECT
        "Programs"."id",
        "Programs"."enTitle",
        "Programs"."arTitle",
        "Programs"."thumbnail",
        "Programs"."categoryId",
        "Category"."enName" AS "categoryEnName",
        "Category"."arName" AS "categoryArName",
        "Programs"."status"::TEXT AS "status",
        "Programs"."publicationStatus"::TEXT AS "publicationStatus",
        'COURSE' AS "type",
        "Programs"."createdAt",
        "Programs"."updatedAt",
        "courseDetail"."approvedAt" AS "publishedAt",
        "courseDetail"."enrolledUsersCount",
        (
          SELECT CAST(COALESCE(SUM("LPRS"."lecturerShare"), 0) AS NUMERIC(10,2)) / 100
          FROM "LearningProgramRevenueShares" "LPRS"
          INNER JOIN "Transactions" "T"
            ON "LPRS"."transactionId" = "T"."id"
          WHERE "LPRS"."programId" = "Programs"."id"
            AND "LPRS"."programType" = 'Course'
            AND "T"."status" = 'SUCCESS'
        ) AS "revenue"
      FROM "Courses" "Programs"
      INNER JOIN "CourseLecturers"
        ON "Programs"."id" = "CourseLecturers"."courseId"
      LEFT JOIN "CourseDetails" "courseDetail"
        ON "Programs"."id" = "courseDetail"."courseId"
      LEFT JOIN "Categories" "Category"
        ON "Programs"."categoryId" = "Category"."id"
      WHERE "CourseLecturers"."lecturerId" = :lecturerId
        AND "Programs"."status" IN ('PENDING', 'REJECTED', 'APPROVED')
        ${filter?.categoryIds ? 'AND "Programs"."categoryId" IN (:categoryIds)' : ''}
        ${filter?.status ? 'AND "Programs"."status"::TEXT = :status' : ''}
        ${filter?.visibility ? 'AND "Programs"."publicationStatus" = :visibility' : ''}
        ${filter?.searchKey ? 'AND ("Programs"."enTitle" ILIKE :searchKey OR "Programs"."arTitle" ILIKE :searchKey)' : ''}
    `;
  }

  private getCoursesAndDiplomasQuery(
    filter: LecturerLearningProgramFilterInput,
    replacements: Record<string, any>
  ): string {
    return `
      ${this.getCoursesQuery(filter, replacements)}
      UNION ALL
      ${this.getDiplomasQuery(filter, replacements)}
    `;
  }

  private getDiplomasQuery(
    filter: LecturerLearningProgramFilterInput,
    replacements: Record<string, any>
  ): string {
    return `
      SELECT
        "Diplomas"."id",
        "Diplomas"."enTitle",
        "Diplomas"."arTitle",
        "Diplomas"."thumbnail",
        "Diplomas"."categoryId",
        "Category"."enName" AS "categoryEnName",
        "Category"."arName" AS "categoryArName",
        "Diplomas"."status"::TEXT AS "status",
        "Diplomas"."publicationStatus"::TEXT AS "publicationStatus",
        'DIPLOMA' AS "type",
        "Diplomas"."createdAt",
        "Diplomas"."updatedAt",
        "DiplomaDetails"."publishedAt",
        "DiplomaDetails"."enrolledUsersCount",
        (
          SELECT CAST(COALESCE(SUM("LPRS"."lecturerShare"), 0) AS NUMERIC(10,2)) / 100
          FROM "LearningProgramRevenueShares" "LPRS"
          INNER JOIN "Transactions" "T"
            ON "LPRS"."transactionId" = "T"."id"
          WHERE "LPRS"."programId" = "Diplomas"."id"
            AND "LPRS"."programType" = 'Diploma'
            AND "T"."status" = 'SUCCESS'
        ) AS "revenue"
      FROM "Diplomas"
      INNER JOIN "DiplomaCourses"
        ON "Diplomas"."id" = "DiplomaCourses"."diplomaId"
      INNER JOIN "CourseLecturers"
        ON "DiplomaCourses"."courseId" = "CourseLecturers"."courseId"
      INNER JOIN "DiplomaDetails"
        ON "Diplomas"."id" = "DiplomaDetails"."diplomaId"
      LEFT JOIN "Categories" "Category"
        ON "Diplomas"."categoryId" = "Category"."id"
      WHERE "CourseLecturers"."lecturerId" = :lecturerId
        AND "Diplomas"."status" = 'APPROVED'
        ${filter?.categoryIds ? 'AND "Diplomas"."categoryId" IN (:categoryIds)' : ''}
        ${filter?.status ? 'AND "Diplomas"."status"::TEXT = :status' : ''}
        ${filter?.visibility ? 'AND "Diplomas"."publicationStatus" = :visibility' : ''}
        ${filter?.searchKey ? 'AND ("Diplomas"."enTitle" ILIKE :searchKey OR "Diplomas"."arTitle" ILIKE :searchKey)' : ''}
    `;
  }

  // AND "Diplomas"."status" IN ('PENDING', 'REJECTED', 'APPROVED')

  private getSortByField(sort: LecturerLerningProgramSortInput): string {
    return (
      sort.sortBy === LecturerLerningProgramSortEnum.REVENUE ? `"revenue"`
      : sort.sortBy === LecturerLerningProgramSortEnum.JOINED ?
        `"enrolledUsersCount"`
      : sort.sortBy === LecturerLerningProgramSortEnum.PUBLISHED_AT ?
        `"publishedAt"`
      : `"updatedAt"`
    );
  }

  private async executeMainQuery(
    finalQuery: string,
    replacements: { [key: string]: any }
  ): Promise<LecturerLearningProgram[]> {
    return (await this.sequelize.query<LecturerLearningProgram>(finalQuery, {
      type: QueryTypes.SELECT,
      replacements
    })) as LecturerLearningProgram[];
  }

  private getCountQuery(baseQuery: string): string {
    return `
      SELECT COUNT(*) AS "totalCount"
      FROM (
        SELECT DISTINCT "id", "type"
        FROM (
          ${baseQuery}
        ) AS "programs"
      ) AS "countedPrograms"
    `;
  }

  private async executeCountQuery(
    countQuery: string,
    replacements: { [key: string]: any }
  ): Promise<{ totalCount: number }[]> {
    return await this.sequelize.query<{ totalCount: number }>(countQuery, {
      type: QueryTypes.SELECT,
      replacements
    });
  }

  private formatResponse(
    programs: LecturerLearningProgram[],
    page: number,
    limit: number,
    totalCount: number
  ): PaginationRes<LecturerLearningProgram> {
    return {
      items: programs,
      pageInfo: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasBefore: page > 1
      }
    };
  }

  async getDiplomasByLectureId(lecturerId: string) {
    const diplomaCourses = await this.diplomaCoursesRepo.findAll(
      {
        keptForOldAssignments: false
      },
      [
        {
          model: Course,
          required: true,
          include: [
            {
              model: CourseLecturer,
              required: true,
              where: { lecturerId }
            }
          ]
        }
      ]
    );

    const diplomasIds = diplomaCourses.map(dc => dc.diplomaId);
    const uniqueDiplomasIds = [...new Set(diplomasIds)];

    return await this.diplomasRepo.findAll({
      id: uniqueDiplomasIds,
      publicationStatus: PublicationStatusEnum.PUBLIC,
      status: DiplomaStatusEnum.APPROVED
    });
  }

  async exportLecturers(id?: string): Promise<string> {
    const lecturers = await this.fetchLecturersData(id);

    const headers = [
      'ID',
      'En_FullName',
      'Email',
      'Phone',
      'Nationality',
      'Country',
      'Years_Of_Experience',
      'Job_Title',
      'Field_of_Trainings',
      'LinkedIn_Url',
      'Facebook_Url',
      'CV_Url'
    ];

    const formattedData = lecturers.map(lecturer => ({
      ID: lecturer.id,
      En_FullName: lecturer.user?.enFullName || '',
      Email: lecturer.user?.email || '',
      Phone: lecturer.user?.phone || '',
      Nationality: lecturer.user?.nationality || '',
      Country: lecturer.user?.country || '',
      Years_Of_Experience: lecturer.yearsOfExperience || '',
      Job_Title: lecturer.jobTitle?.enName || '',
      Field_of_Trainings:
        lecturer.fieldOfTrainings?.length ?
          `{${lecturer.fieldOfTrainings.map(f => f.enName).join(', ')}}`
        : '',
      LinkedIn_Url: lecturer.linkedInUrl || '',
      Instagram_Url: lecturer.instagramUrl || '',
      Facebook_Url: lecturer.facebookUrl || '',
      CV_Url: lecturer.cvUrl || ''
    }));

    const csvContent = await this.convertToCSV(formattedData, headers);

    return await this.helperService.createCSVFile(csvContent, true);
  }

  private async convertToCSV(data: any[], headers: string[]) {
    try {
      return parse(data, {
        fields: headers,
        quote: ''
      });
    } catch (err) {
      console.log('Error when converting to CSV:', err);
      return '';
    }
  }

  async fetchLecturersData(id?: string): Promise<Lecturer[]> {
    const lecturers = await this.lecturerRepo.findAll(
      {
        ...(id ? { id } : {})
      },
      [
        {
          model: User,
          as: 'user',
          attributes: [
            'enFullName',
            'arFullName',
            'email',
            'phone',
            'nationality',
            'country'
          ]
        },
        {
          model: FieldOfTraining,
          as: 'fieldOfTrainings',
          attributes: ['enName']
        },
        {
          model: JobTitle,
          as: 'jobTitle',
          attributes: ['enName']
        }
      ],
      [],
      [
        'id',
        'yearsOfExperience',
        'linkedInUrl',
        'facebookUrl',
        'cvUrl',
        'instagramUrl'
      ]
    );

    return lecturers;
  }

  async commissionUnderCourse(lecturerId: string, courseId: string) {
    const courseLecturer = await this.courseLecturersRepo.findOne({
      courseId,
      lecturerId
    });
    if (courseLecturer) {
      return {
        commission: courseLecturer.commission,
        commissionType: courseLecturer.commissionType
      };
    }

    return null;
  }
}
