import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { OnEvent } from '@nestjs/event-emitter';
import { BunnyService } from '@src/_common/bunny/bunny-service';
import { MailService } from '@src/_common/mail/mail.service';
import { IMailService } from '@src/_common/mail/mail.type';
import { Templates } from '@src/_common/mail/templates-types';
import { UploaderService } from '@src/_common/uploader/uploader.service';
import { HelperService } from '@src/_common/utils/helper.service';
import {
  LearningProgramTypeEnum,
  UpperCaseLearningProgramTypeEnum
} from '@src/cart/enums/cart.enums';
import { CartItem } from '@src/cart/models/cart-item.model';
import { CertificationService } from '@src/certification/certification.service';
import { Comment } from '@src/comment/models/comment.model';
import { Category } from '@src/course-specs/category/category.model';
import { CategoryService } from '@src/course-specs/category/category.service';
import { CourseSkill } from '@src/course-specs/skill/models/course-skill.model';
import { SkillService } from '@src/course-specs/skill/skill.service';
import { CourseTool } from '@src/course-specs/tool/models/course-tool.mode';
import { ToolService } from '@src/course-specs/tool/tool.service';
import { DiplomaStatusEnum } from '@src/diploma/enums/diploma-status.enum';
import { DiplomaCourses } from '@src/diploma/models/diploma-course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { EmailToUsersTypeEnum } from '@src/diploma/types/calculate-prices-under-diloma';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { LecturerService } from '@src/lecturer/services/lecturer.service';
import {
  TRANSACTION_FULFILLED_EVENT,
  TRANSACTION_REFUNDED_EVENT
} from '@src/payment/constants/events-tokens.constants';
import { GeneralSearchFilter } from '@src/search/interfaces/inputs.interfaces';
import { Queue } from 'bull';
import { Ulid } from 'id128';
import {
  Includeable,
  Op,
  Order,
  QueryTypes,
  Transaction,
  WhereOptions
} from 'sequelize';
import {
  SEQUELIZE_INSTANCE_NEST_DI_TOKEN,
  Transactional
} from 'sequelize-transactional-typescript';
import { Sequelize } from 'sequelize-typescript';
import { UploadedVideoLibrary } from '../../_common/bunny/bunny.type';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import {
  NullablePaginatorInput,
  PaginatorInput
} from '../../_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '../../_common/paginator/paginator.types';
import { CodePrefix } from '../../_common/utils/helpers.enum';
import { Skill } from '../../course-specs/skill/models/skill.model';
import { Tool } from '../../course-specs/tool/models/tool.model';
import { User } from '../../user/models/user.model';
import { UserRoleEnum } from '../../user/user.enum';
import { CourseDto } from '../dto/course.dto';
import {
  CommissionType,
  CourseFinalStatus,
  CourseSortEnum,
  CourseStatusEnum,
  CourseStatusFilter,
  CourseTypeEnum,
  LessonTypeEnum,
  PublicationStatusEnum,
  ReplyRequestStatusEnum,
  SyllabusCreationMethodEnum
} from '../enums/course.enum';
import {
  CourseUserFilterEnum,
  CourseUserFilterInput
} from '../inputs/course-user-filter.input';
import {
  CourseUserSortInput,
  UserCourseSortEnum
} from '../inputs/course-user-sort.input';
import { CancelPurchaseRequestInput } from '../inputs/create-cancel-purchase-request.input';
import {
  CourseLecturerInput,
  CreateCourseByAdminInput,
  CreateCourseByLecturerInput,
  CreateDraftedCourseByAdminInput,
  CreateDraftedCourseByLecturerInput
} from '../inputs/create-course.input';
import {
  CourseFilterByAdminInput,
  CourseFilterByLecturerInput,
  CourseSortInput,
  CoursesSortSiteInput
} from '../inputs/filter-course.input';
import { LearningProgramFilterInput } from '../inputs/Learning-program-filter.Input';
import { LearningProgramInput } from '../inputs/learning-program.input';
import {
  PublishDraftedCourseAdminInput,
  PublishDraftedCourseLecturerInput
} from '../inputs/publish-draft.input';
import { ReplyCourseRequest } from '../inputs/reply-course-request.input';
import {
  ExploreSort,
  ExploreSortByEnum,
  SearchFilterInput,
  SearchSort,
  SearchSortInput
} from '../inputs/search.types';
import {
  UpdateCourseByAdminInput,
  UpdateCourseByLecturerInput,
  UpdateCourseSectionsInput
} from '../inputs/update-course.input';
import {
  AssignUserToLearningProgramEvent,
  TransactionRefundedEvent,
  UnassignUserFromLearningProgramEvent
} from '../interfaces/assign-user.interface';
import {
  LearningProgramsExplore,
  LearningProgramsForCategory
} from '../interfaces/learning-programs-explore.response';
import { CancelCoursePurchase } from '../models/cancel-request.model';
import { Collection } from '../models/collection.model';
import { CourseDetail } from '../models/course-detail.model';
import { ChangeLog } from '../models/course-log.model';
import { Course } from '../models/course.model';
import { Lesson } from '../models/lesson.model';
import { Section } from '../models/section.model';
import { UsersAssignment } from '../models/user-assignments.model';
import { CourseUnderDiplomaData } from '../resolvers/course.resolver';
import { SectionService } from './section.service';
import { AssignUsersToDiplomaInput } from '@src/diploma/inputs/assign-user-to-diploma.input';
import { DiplomaDetail } from '@src/diploma/models/diploma-detail.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cart } from '@src/cart/models/cart.model';
import {
  NotificationParentTypeEnum,
  NotificationTypeEnum,
  SiteNotificationsTypeEnum
} from '@src/notification/notification.enum';
import { NotificationService } from '@src/notification/notification.service';
import { Notification } from '@src/notification/models/notification.model';
import { CourseLecturer } from '../models/course-lecturers.model';
import { SystemConfig } from '@src/system-configuration/models/system-config.model';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { CartService } from '@src/cart/services/cart.service';
import { Certification } from '@src/certification/certification.model';
import { CertifiedResponse } from '../interfaces/completed.response';
import { Blog } from '@src/blogs/blog/models/blog.model';
import { BlogCategory } from '@src/blogs/blog-category/bLog-category.model';
import { Tag } from '@src/blogs/blog-tag/tag.model';
import { UserAnswerQuizAnswer } from '@src/quiz/models/user-answer-quiz-answer.model';
import { UserQuizAttempt } from '@src/quiz/models/user-quiz-attempts.model';
import { UserAnswer } from '@src/quiz/models/user-answer.model';
import { UserLessonProgress } from '../models/user-lesson-progress.model';
import { ContentReport } from '@src/report/models/report.model';
import { slugify } from 'transliteration';
import { ConfigService } from '@nestjs/config';
import { DiplomaTypeEnum } from '@src/diploma/enums/diploma-type.enum';
import { UserCourseDiplomaView } from '@src/diploma/models/user-course-diploma-view.model';

// import { DiplomaCourses } from '@src/diploma/models/diploma-course.model';

@Injectable()
export class CourseService {
  constructor(
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomaRepo: IRepository<Diploma>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.CourseSkillsRepository)
    private readonly courseSkillRepo: IRepository<CourseSkill>,
    @Inject(Repositories.CourseToolsRepository)
    private readonly courseToolRepo: IRepository<CourseTool>,
    @Inject(Repositories.CourseDetailsRepository)
    private readonly courseDetailsRepo: IRepository<CourseDetail>,
    @Inject(Repositories.CancelCoursePurchaseRepository)
    private readonly cancelCoursePurchaseRepo: IRepository<CancelCoursePurchase>,
    @Inject(Repositories.CollectionsRepository)
    private readonly collectionRepo: IRepository<Collection>,
    @Inject(Repositories.ChangeLogsRepository)
    private readonly changeLogRepo: IRepository<ChangeLog>,
    @Inject(Repositories.ChangeLogsRepository)
    private readonly sectionRepo: IRepository<Section>,
    @Inject(Repositories.LessonsRepository)
    private readonly lessonRepo: IRepository<Lesson>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly usersAssignmentsRepo: IRepository<UsersAssignment>,
    @Inject(Repositories.SkillsRepository)
    private readonly skillRepo: IRepository<Skill>,
    @Inject(Repositories.ToolsRepository)
    private readonly toolRepo: IRepository<Tool>,
    @Inject(Repositories.DiplomaCoursesRepository)
    private readonly diplomaCoursesRepo: IRepository<DiplomaCourses>,
    @Inject(Repositories.DiplomaDetailsRepository)
    private readonly diplomaDetailsRepo: IRepository<DiplomaDetail>,
    @Inject(Repositories.NotificationsRepository)
    private readonly notificationsRepo: IRepository<Notification>,
    @Inject(Repositories.CommentsRepository)
    private readonly commentRepo: IRepository<Comment>,
    @Inject(Repositories.CourseLecturersRepository)
    private readonly courseLecturersRepo: IRepository<CourseLecturer>,
    @Inject(Repositories.SystemConfigRepository)
    private readonly systemConfigsRepo: IRepository<SystemConfig>,
    @Inject(Repositories.CertificationsRepository)
    private readonly certificationRepo: IRepository<Certification>,
    @Inject(Repositories.CartsRepository)
    private readonly cartRepo: IRepository<Cart>,
    @Inject(Repositories.CartItemsRepository)
    private readonly cartItemRepo: IRepository<CartItem>,
    @Inject(Repositories.BlogsRepository)
    private readonly blogRepo: IRepository<Blog>,
    @Inject(Repositories.CategoriesRepository)
    private readonly categoryRepo: IRepository<Category>,
    @Inject(Repositories.BlogCategoriesRepository)
    private readonly blogCategoryRepo: IRepository<BlogCategory>,
    @Inject(Repositories.TagsRepository)
    private readonly TagsRepo: IRepository<Tag>,
    @Inject(Repositories.UserAnswerQuizAnswersRepository)
    private readonly userAnswerQuizAnswerRepo: IRepository<UserAnswerQuizAnswer>,
    @Inject(Repositories.UserQuizAttemptsRepository)
    private readonly userQuizAttemptRepo: IRepository<UserQuizAttempt>,
    @Inject(Repositories.UserAnswersRepository)
    private readonly userAnswerRepo: IRepository<UserAnswer>,
    @Inject(Repositories.UserLessonProgressRepository)
    private readonly userLessonProgressRepo: IRepository<UserLessonProgress>,
    @Inject(Repositories.ContentReportsRepository)
    private readonly reportRepo: IRepository<ContentReport>,
    @Inject(Repositories.UserCourseDiplomaViewsRepository)
    private readonly userCourseDiplomaViewRepo: IRepository<UserCourseDiplomaView>,
    //...
    @InjectQueue('PricingCalcs')
    private readonly pricingCalcsQueue: Queue,
    @InjectQueue('pusher') private readonly pusherQueue: Queue,
    @Inject(MailService) private readonly mailService: IMailService,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,

    //...
    private readonly helperService: HelperService,
    private readonly skillService: SkillService,
    private readonly toolService: ToolService,
    private readonly categoryService: CategoryService,
    private readonly lecturerService: LecturerService,
    private readonly uploaderService: UploaderService,
    private readonly sectionService: SectionService,
    private readonly bunnyService: BunnyService,
    private readonly siteNotificationsService: NotificationService,
    private readonly certificationService: CertificationService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cartService: CartService,
    private moduleRef: ModuleRef,
    private readonly configService: ConfigService
  ) {}

  private async getVatValues(): Promise<{
    vatPercentage: number;
    paymentGatewayVatPercentage: number;
  }> {
    const systemConfig = (await this.systemConfigsRepo.findOne({}))?.dataValues;
    return {
      vatPercentage: systemConfig?.vat ?? 14,
      paymentGatewayVatPercentage: systemConfig?.paymentGatewayVat ?? 2
    };
  }

  // async myInProgress(
  //   currentUser: User,
  //   pagination: NullablePaginatorInput
  // ): Promise<PaginationRes<Course>> {
  //   if (!currentUser) {
  //     throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
  //   }
  // let learningProgramsIds = (
  //   await this.usersAssignmentsRepo.findAll({
  //     userId: currentUser?.id,
  //     completed: false
  //   })
  // ).map(uc => uc.courseId);

  // learningProgramsIds = [...new Set(learningProgramsIds)];

  // console.log(learningProgramsIds);
  // console.log('----------------------')

  // const courses = await this.courseRepo.findPaginated(
  //   {
  //     id: {
  //       [Op.in]: learningProgramsIds
  //     }
  //   },
  //   [[Sequelize.col('createdAt'), SortTypeEnum.DESC]],
  //   pagination?.paginate?.page || 1,
  //   pagination?.paginate?.limit || 5
  // );

  // console.log(courses.items.map(c => c.id));
  // console.log()

  // }

  async myInProgress(
    currentUser: User,
    pagination: NullablePaginatorInput
  ): Promise<PaginationRes<Course>> {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    const userAssignments = await this.usersAssignmentsRepo.findAll(
      {
        userId: currentUser.id,
        completed: false
      },
      [],
      [[Sequelize.col('createdAt'), SortTypeEnum.DESC]]
    );

    let learningProgramsIds = userAssignments.map(ua => ua.courseId);

    // Remove duplicates but preserve order
    const seen = new Set();
    learningProgramsIds = learningProgramsIds.filter(id => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const page = pagination?.paginate?.page || 1;
    const limit = pagination?.paginate?.limit || 15;
    const offset = (page - 1) * limit;

    const paginatedCourseIds = learningProgramsIds.slice(
      offset,
      offset + limit
    );

    const courses = await this.courseRepo.findAll({
      id: { [Op.in]: paginatedCourseIds }
    });

    // Sort manually to match order in paginatedCourseIds
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const sortedCourses = paginatedCourseIds
      .map(id => courseMap.get(id))
      .filter(Boolean);

    return {
      items: sortedCourses,
      pageInfo: {
        page,
        limit,
        totalCount: learningProgramsIds.length,
        totalPages: Math.ceil(learningProgramsIds.length / limit),
        hasNext: page * limit < learningProgramsIds.length,
        hasBefore: page > 1
      }
    };
  }

  async myCompleted(
    currentUser: User,
    pagination?: NullablePaginatorInput
  ): Promise<any> {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    const allCompleted = await this.usersAssignmentsRepo.findAll(
      {
        userId: currentUser?.id,
        completed: true
      },
      [{ model: Course }]
    );

    const allCompletedGroupedByDiplomas: {
      diploma: Diploma;
      completedCourses: Course[];
    }[] = [];

    const seenCourseIds = new Set<string>();

    for (const completed of allCompleted) {
      const courseId = completed.course.id;

      // skip duplicates
      if (seenCourseIds.has(courseId)) continue;
      seenCourseIds.add(courseId);

      const diploma =
        completed.diplomaId ?
          await this.diplomaRepo.findOne({ id: completed.diplomaId })
        : null;

      const existingGroup = allCompletedGroupedByDiplomas.find(
        f => f.diploma?.id === completed.diplomaId
      );

      if (existingGroup) {
        existingGroup.completedCourses.push(completed.course);
      } else {
        allCompletedGroupedByDiplomas.push({
          diploma,
          completedCourses: [completed.course]
        });
      }
    }

    const { page, limit } = pagination?.paginate || { page: 1, limit: 15 };
    const paginatedResult = allCompletedGroupedByDiplomas.slice(
      (page - 1) * limit,
      page * limit
    );

    return {
      items: paginatedResult,
      pageInfo: {
        page,
        limit,
        hasBefore: page > 1 || false,
        hasNext: allCompletedGroupedByDiplomas.length > page * limit || false,
        totalCount: allCompletedGroupedByDiplomas.length,
        totalPages: Math.ceil(allCompletedGroupedByDiplomas.length / limit)
      }
    };
  }

  async myCertifiedPrograms(
    currentUser: User,
    pagination?: NullablePaginatorInput
  ): Promise<any> {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    const allCertifications = await this.certificationRepo.findAll({
      userId: currentUser.id
    });

    const groupedByPrograms: CertifiedResponse[] = [];
    const seenCourseIds = new Set<string>();

    /** ===================== 1) DIPLOMAS ===================== */
    const diplomaCerts = allCertifications.filter(
      cert =>
        cert.learningProgramType === UpperCaseLearningProgramTypeEnum.DIPLOMA
    );

    for (const cert of diplomaCerts) {
      const diploma = await this.diplomaRepo.findOne({
        id: cert.learningProgramId
      });
      if (!diploma) continue;

      const diplomaCourses = await this.diplomaCoursesRepo.findAll(
        {
          diplomaId: diploma.id
        },
        [
          {
            model: Course
          }
        ]
      );

      const certifiedCoursesInDiploma = [];
      for (const dc of diplomaCourses) {
        if (!dc.course) continue;

        const hasCertificate = allCertifications.some(
          c =>
            (c.learningProgramType ===
              UpperCaseLearningProgramTypeEnum.COURSE ||
              c.learningProgramType ===
                UpperCaseLearningProgramTypeEnum.WORKSHOP) &&
            c.learningProgramId === dc.course.id
        );

        if (hasCertificate && !seenCourseIds.has(dc.course.id)) {
          seenCourseIds.add(dc.course.id);
          certifiedCoursesInDiploma.push(dc.course);
        }
      }

      if (!certifiedCoursesInDiploma.length) continue;

      const existingGroup = groupedByPrograms.find(
        g => g.diploma?.id === diploma.id
      );

      if (existingGroup) {
        existingGroup.certifiedCourses.push(...certifiedCoursesInDiploma);
      } else {
        groupedByPrograms.push({
          diploma,
          certifiedCourses: certifiedCoursesInDiploma
        });
      }
    }

    /** ===================== 2)  COURSES ===================== */
    const singleCerts = allCertifications.filter(
      cert =>
        cert.learningProgramType === UpperCaseLearningProgramTypeEnum.COURSE ||
        cert.learningProgramType === UpperCaseLearningProgramTypeEnum.WORKSHOP
    );

    for (const cert of singleCerts) {
      const course = await this.courseRepo.findOne({
        id: cert.learningProgramId
      });
      if (!course) continue;

      if (seenCourseIds.has(course.id)) continue;
      seenCourseIds.add(course.id);

      groupedByPrograms.push({
        diploma: null,
        certifiedCourses: [course]
      });
    }

    /** ===================== 3) Pagination ===================== */
    const { page, limit } = pagination?.paginate || { page: 1, limit: 5 };
    const paginatedResult = groupedByPrograms.slice(
      (page - 1) * limit,
      page * limit
    );

    return {
      items: paginatedResult,
      pageInfo: {
        page,
        limit,
        hasBefore: page > 1,
        hasNext: groupedByPrograms.length > page * limit,
        totalCount: groupedByPrograms.length,
        totalPages: Math.ceil(groupedByPrograms.length / limit)
      }
    };
  }

  async myCourses(
    user: User,
    filter: CourseUserFilterInput,
    sort?: SearchSort,
    paginate: PaginatorInput = { page: 0, limit: 5 }
  ): Promise<PaginationRes<Course>> {
    const progress = filter?.progress;
    const { page, limit } = paginate;

    const commonWhereOptions = {
      userId: user.id,
      ...(progress === CourseUserFilterEnum.COMPLETED && { completed: true }),
      ...(progress === CourseUserFilterEnum.PROGRESS && { completed: false })
    };

    const { items, pageInfo } = await this.usersAssignmentsRepo.findPaginated(
      {
        ...commonWhereOptions
      },
      //[['completed', SortTypeEnum.ASC] , ((filter.sortBy && filter.sortType) && ([filter.sortBy, filter.sortType]))],
      [
        [
          Sequelize.col(sort?.sortBy || 'createdAt'),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      page,
      limit,
      [
        {
          model: Course,
          where: {
            ...(filter?.type && { type: filter?.type }),
            ...(filter?.level && { level: filter?.level }),
            ...(filter?.categoryId && { categoryId: filter?.categoryId })
          }
        }
      ]
    );

    const courses = items.map(item => item.course);

    return { items: courses, pageInfo };
  }

  async cancelPurchaseRequest(
    user: User,
    requestBody: CancelPurchaseRequestInput
  ): Promise<CancelCoursePurchase> {
    const userId = user.id;
    const { courseId, reason } = requestBody;

    const course = await this.courseRepo.findOne({ id: courseId }, [
      'assignedUsers'
    ]);
    if (!course) throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);

    if (course.assignedUsers.every(assignedUser => assignedUser.id !== userId))
      throw new BaseHttpException(ErrorCodeEnum.USER_NOT_ASSIGNED_TO_COURSE);

    //TODO we need to send this mail to the admin

    return await this.cancelCoursePurchaseRepo.createOne({
      userId: user.id,
      courseId,
      reason
    });
  }

  async search(
    filter: SearchFilterInput,
    paginator?: NullablePaginatorInput,
    sort?: SearchSortInput
  ): Promise<PaginationRes<Course>> {
    const { items, pageInfo } = await this.courseRepo.findPaginated(
      {
        publicationStatus: PublicationStatusEnum.PUBLIC,
        ...(filter.filter.searchKey && {
          [Op.or]: [
            { enTitle: { [Op.iLike]: `%${filter.filter.searchKey}%` } },
            { arTitle: { [Op.iLike]: `%${filter.filter.searchKey}%` } },
            {
              '$category.enName$': {
                [Op.iLike]: `%${filter.filter.searchKey}%`
              }
            },
            {
              '$category.arName$': {
                [Op.iLike]: `%${filter.filter.searchKey}%`
              }
            }
          ]
        }),
        ...(filter.filter?.categoryId && {
          categoryId: filter.filter?.categoryId
        }),
        ...(filter.filter?.level && { level: filter.filter?.level }),
        ...(filter.filter.price && {
          price: { [Op.gte]: filter.filter?.price }
        })
      },
      [
        [
          Sequelize.col(sort?.sort?.sortBy || 'createdAt'),
          sort?.sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginator?.paginate?.page || 1,
      paginator?.paginate?.limit || 15,
      [
        {
          model: Category,
          as: 'category'
        }
      ]
    );

    console.log('items', items);

    return { items, pageInfo };
  }

  async createCourseByAdmin(input: CreateCourseByAdminInput): Promise<Course> {
    if (!input.lecturersInput?.length) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_MUST_HAVE_LECTURER);
    }

    // Validate all lecturers and prepare data
    const validatedLecturers = await Promise.all(
      input.lecturersInput.map(async lecturerInput => {
        const lecturerUser =
          await this.lecturerService.validateLecturerForCourseCreation(
            lecturerInput.userIdOfLecturer
          );

        return {
          id: lecturerUser.id,
          commission: lecturerInput.commission,
          commissionType: lecturerInput.commissionType
        };
      })
    );

    // Create the course with validated lecturers
    const newCourse = await this.createCourse({
      ...input,
      isCreatedByAdmin: true,
      status: CourseStatusEnum.APPROVED,
      lecturersInput: validatedLecturers.map(l => ({
        userIdOfLecturer: l.id,
        commission: l.commission,
        commissionType: l.commissionType
      }))
    });

    // Update each lecturer lastCourseCreatedAt
    await Promise.all(
      validatedLecturers.map(({ id }) =>
        this.lecturerRepo.updateOne({ id }, { lastCourseCreatedAt: new Date() })
      )
    );

    // Send notifications if the course is public
    if (newCourse.publicationStatus === PublicationStatusEnum.PUBLIC) {
      const courseDetails = await this.courseDetailsRepo.findOne({
        courseId: newCourse.id
      });

      try {
        await this.sendEmailsAndSiteNotificationsToUsers(
          newCourse,
          EmailToUsersTypeEnum.NEW_PROGRAM_AVAILABLE,
          null,
          courseDetails.promoVideo
        );
      } catch (error) {
        console.log('error in sending emails', error);
      }
    }

    return newCourse;
  }

  async createCourseByLecturer(
    input: CreateCourseByLecturerInput,
    currentUser: User
  ): Promise<Course> {
    if (!currentUser.lecturer.hasCompletedProfile)
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_PROFILE_NOT_COMPLETED);

    const newCourse = await this.createCourse(
      {
        ...input,
        isCreatedByAdmin: false,
        status: CourseStatusEnum.PENDING
      },
      currentUser.lecturer
    );

    return newCourse;
  }

  // async createDraftedCourseByLecturer(
  //   input: CreateDraftedCourseByLecturerInput,
  //   currentUser: User
  // ): Promise<Course> {
  //   if (!this.helperService.validateObjectAtLeastOneKey(input))
  //     throw new BaseHttpException(
  //       ErrorCodeEnum.DRAFTED_PROGRAM_MUST_INCLUDE_ONE_INPUT
  //     );

  //   if (!currentUser.lecturer.hasCompletedProfile)
  //     throw new BaseHttpException(ErrorCodeEnum.LECTURER_PROFILE_NOT_COMPLETED);

  //   return await this.createCourse(
  //     { ...input, isCreatedByAdmin: false, status: CourseStatusEnum.DRAFTED },
  //     currentUser.lecturer.id
  //   );
  // }

  // async createDraftedCourseByAdmin(
  //   input: CreateDraftedCourseByAdminInput
  // ): Promise<Course> {
  //   let lecturerUser: User;

  //   if (!this.helperService.validateObjectAtLeastOneKey(input))
  //     throw new BaseHttpException(
  //       ErrorCodeEnum.DRAFTED_PROGRAM_MUST_INCLUDE_ONE_INPUT
  //     );

  //   if (input.userIdOfLecturer)
  //     lecturerUser =
  //       await this.lecturerService.validateLecturerForCourseCreation(
  //         input.userIdOfLecturer
  //       );

  //   return await this.createCourse(
  //     { ...input, isCreatedByAdmin: true, status: CourseStatusEnum.DRAFTED },
  //     lecturerUser?.lecturer?.id
  //   );
  // }

  // async createPreviewCourseByAdmin(
  //   input: CreateDraftedCourseByAdminInput
  // ): Promise<Course> {
  //   let lecturerUser: User;

  //   if (!this.helperService.validateObjectAtLeastOneKey(input))
  //     throw new BaseHttpException(
  //       ErrorCodeEnum.DRAFTED_PROGRAM_MUST_INCLUDE_ONE_INPUT
  //     );

  //   if (input?.userIdOfLecturer)
  //     lecturerUser =
  //       await this.lecturerService.validateLecturerForCourseCreation(
  //         input.userIdOfLecturer
  //       );

  //   await this.courseRepo.deleteAll({
  //     ...(lecturerUser && { lecturerId: lecturerUser?.lecturer?.id }),
  //     status: CourseStatusEnum.PREVIEWED,
  //     isCreatedByAdmin: true
  //   });

  //   return await this.createCourse(
  //     { ...input, status: CourseStatusEnum.PREVIEWED, isCreatedByAdmin: true },
  //     lecturerUser?.lecturer?.id
  //   );
  // }

  // async createPreviewCourseByLecturer(
  //   input: CreateDraftedCourseByLecturerInput,
  //   currentUser: User
  // ): Promise<Course> {
  //   if (!this.helperService.validateObjectAtLeastOneKey(input))
  //     throw new BaseHttpException(
  //       ErrorCodeEnum.DRAFTED_PROGRAM_MUST_INCLUDE_ONE_INPUT
  //     );

  //   if (!currentUser.lecturer.hasCompletedProfile)
  //     throw new BaseHttpException(ErrorCodeEnum.LECTURER_PROFILE_NOT_COMPLETED);

  //   await this.courseRepo.deleteAll({
  //     lecturerId: currentUser.lecturer.id,
  //     status: CourseStatusEnum.PREVIEWED,
  //     isCreatedByAdmin: false
  //   });

  //   return await this.createCourse(
  //     { ...input, status: CourseStatusEnum.PREVIEWED, isCreatedByAdmin: false },
  //     currentUser.lecturer.id
  //   );
  // }

  async createDraftedCourseByLecturer(
    input: CreateDraftedCourseByLecturerInput,
    currentUser: User
  ): Promise<Course> {
    if (!this.helperService.validateObjectAtLeastOneKey(input)) {
      throw new BaseHttpException(
        ErrorCodeEnum.DRAFTED_PROGRAM_MUST_INCLUDE_ONE_INPUT
      );
    }

    if (!currentUser.lecturer.hasCompletedProfile) {
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_PROFILE_NOT_COMPLETED);
    }

    return await this.createCourse(
      {
        ...input,
        isCreatedByAdmin: false,
        status: CourseStatusEnum.DRAFTED
        // lecturersInput: [
        //   {
        //     userIdOfLecturer: currentUser.lecturer.userId,
        //     commissionPercentage: currentUser.lecturer.commissionPercentage
        //   }
        // ]
      },

      currentUser.lecturer
    );
  }

  async createDraftedCourseByAdmin(
    input: CreateDraftedCourseByAdminInput
  ): Promise<Course> {
    if (!this.helperService.validateObjectAtLeastOneKey(input)) {
      throw new BaseHttpException(
        ErrorCodeEnum.DRAFTED_PROGRAM_MUST_INCLUDE_ONE_INPUT
      );
    }

    let validatedLecturers: any[] = [];
    if (
      input &&
      Array.isArray(input.lecturersInput) &&
      input.lecturersInput.length > 0
    ) {
      validatedLecturers = await Promise.all(
        input.lecturersInput.map(async lecturerInput => {
          const lecturerUser =
            await this.lecturerService.validateLecturerForCourseCreation(
              lecturerInput.userIdOfLecturer
            );

          return {
            id: lecturerUser.lecturer.userId,
            commission: lecturerInput.commission,
            commissionType: lecturerInput.commissionType
          };
        })
      );
    }

    const newCourse = await this.createCourse({
      ...input,
      isCreatedByAdmin: true,
      status: CourseStatusEnum.DRAFTED,
      ...(validatedLecturers && {
        lecturersInput: validatedLecturers.map(l => ({
          userIdOfLecturer: l.id,
          commission: l.commission,
          commissionType: l.commissionType
        }))
      })
    });

    return newCourse;
  }

  async createPreviewCourseByAdmin(
    input: CreateDraftedCourseByAdminInput
  ): Promise<Course> {
    if (!this.helperService.validateObjectAtLeastOneKey(input)) {
      throw new BaseHttpException(
        ErrorCodeEnum.DRAFTED_PROGRAM_MUST_INCLUDE_ONE_INPUT
      );
    }

    const lecturersInput = input.lecturersInput ?? [];

    let validatedLecturers = [];

    if (lecturersInput.length) {
      validatedLecturers = await Promise.all(
        lecturersInput.map(async lecturerInput => {
          const lecturerUser =
            await this.lecturerService.validateLecturerForCourseCreation(
              lecturerInput.userIdOfLecturer
            );

          return {
            id: lecturerUser.lecturer.userId,
            commissionPercentage: lecturerInput.commission,
            commissionType: lecturerInput.commissionType
          };
        })
      );

      const coursesToDelete = await this.courseRepo.findAll(
        {
          status: CourseStatusEnum.PREVIEWED,
          isCreatedByAdmin: true
        },
        [
          {
            model: CourseLecturer,
            required: true,
            where: {
              lecturerId: {
                [Op.in]: validatedLecturers.map(l => l.id)
              }
            }
          }
        ],
        null,
        ['id']
      );

      const courseIds = coursesToDelete.map(course => course.id);

      if (courseIds.length) {
        await this.courseRepo.deleteAll({
          id: {
            [Op.in]: courseIds
          }
        });
      }
    }

    return await this.createCourse({
      ...input,
      status: CourseStatusEnum.PREVIEWED,
      isCreatedByAdmin: true,
      ...(validatedLecturers && {
        lecturersInput: validatedLecturers.map(l => ({
          userIdOfLecturer: l.id,
          commission: l.commissionPercentage,
          commissionType: l.commissionType
        }))
      })
    });
  }

  async createPreviewCourseByLecturer(
    input: CreateDraftedCourseByLecturerInput,
    currentUser: User
  ): Promise<Course> {
    if (!this.helperService.validateObjectAtLeastOneKey(input)) {
      throw new BaseHttpException(
        ErrorCodeEnum.DRAFTED_PROGRAM_MUST_INCLUDE_ONE_INPUT
      );
    }

    if (!currentUser.lecturer.hasCompletedProfile) {
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_PROFILE_NOT_COMPLETED);
    }

    const coursesToDelete = await this.courseRepo.findAll(
      {
        status: CourseStatusEnum.PREVIEWED,
        isCreatedByAdmin: false
      },
      [
        {
          model: CourseLecturer,
          required: true,
          where: {
            lecturerId: currentUser.lecturer.id
          }
        }
      ],
      null,
      ['id']
    );

    const courseIds = coursesToDelete.map(course => course.id);

    if (courseIds.length) {
      await this.courseRepo.deleteAll({
        id: {
          [Op.in]: courseIds
        }
      });
    }

    return await this.createCourse(
      {
        ...input,
        status: CourseStatusEnum.PREVIEWED,
        isCreatedByAdmin: false
      },
      currentUser.lecturer
    );
  }

  // async coursesBoardAdmin(
  //   input: CourseFilterByAdminInput = {},
  //   sort: CourseSortInput | CoursesSortSiteInput = {
  //     sortBy: CourseSortEnum.CREATED_AT,
  //     sortType: SortTypeEnum.DESC
  //   },
  //   paginate: PaginatorInput = {}
  // ): Promise<PaginationRes<Course>> {
  //   let lecturerId: string;

  //   if (input.userIdOfLecturer) {
  //     const lecturer = await this.lecturerService.findLecturerByUserIdOrError(
  //       input.userIdOfLecturer
  //     );
  //     lecturerId = lecturer.lecturer.id;
  //   }

  //   // Subquery to calculate the system share for each course
  //   const systemShareSubquery = `
  //     (
  //       SELECT COALESCE(SUM("LearningProgramRevenueShares"."systemShare"), 0)
  //       FROM "LearningProgramRevenueShares"
  //       INNER JOIN "Transactions" ON "LearningProgramRevenueShares"."transactionId" = "Transactions"."id"
  //       INNER JOIN "Courses" ON "LearningProgramRevenueShares"."programId" = "Courses"."id"
  //       WHERE "LearningProgramRevenueShares"."programId" = "Courses"."id"
  //       AND "LearningProgramRevenueShares"."programType" = '${LearningProgramTypeEnum.COURSE}'
  //       AND "Transactions"."status" = 'SUCCESS'
  //     )`;

  //   // TODO: sort by profit not working
  //   // Apply sorting
  //   const order = [
  //     [
  //       sort.sortBy === CourseSortEnum.PROFIT ?
  //         Sequelize.literal(systemShareSubquery)
  //       : Sequelize.col(sort.sortBy),
  //       sort.sortType || SortTypeEnum.DESC
  //     ]
  //   ];

  //   const courses = await this.courseRepo.findPaginated(
  //     {
  //       ...(input.type && { type: input.type }),
  //       ...(input.userIdOfLecturer && {
  //         // lecturerId
  //         courseLecturers: {
  //           lecturerId
  //         }
  //       }),
  //       ...(input.courseStatus === CourseStatusFilter.DRAFTS && {
  //         isCreatedByAdmin: true
  //       }),
  //       ...(input.categoryId && { categoryId: input.categoryId }),
  //       ...(input.publicationStatus && {
  //         publicationStatus: input.publicationStatus
  //       }),
  //       ...(input.syllabusCreationMethod && {
  //         syllabusCreationMethod: input.syllabusCreationMethod
  //       }),
  //       status:
  //         input.courseStatus ?
  //           CourseFinalStatus[input.courseStatus]
  //         : CourseFinalStatus[CourseStatusFilter.PUBLISHED],
  //       ...(input.status && { status: input.status }),
  //       ...(input.searchKey && {
  //         [Op.or]: [
  //           { code: { [Op.iLike]: `%${input.searchKey}%` } },
  //           { arTitle: { [Op.iLike]: `%${input.searchKey}%` } },
  //           { enTitle: { [Op.iLike]: `%${input.searchKey}%` } }
  //         ]
  //       }),
  //       ...(input['level'] && { level: input['level'] })
  //     },
  //     order,
  //     paginate.page,
  //     paginate.limit,
  //     [
  //       { model: CourseDetail,required: false, attributes: [] },
  //       // {
  //       //   model: Lecturer,
  //       //   include: [
  //       //     {
  //       //       model: User
  //       //     }
  //       //   ]
  //       // }
  //       {
  //         model: CourseLecturer,
  //         required: false,
  //         include: [
  //           {
  //             model: Lecturer,
  //             required: false,
  //             include: [
  //               {
  //                 model: User,
  //                 required: false
  //               }
  //             ]
  //           }
  //         ]
  //       }
  //     ],
  //     null,
  //     null,
  //     null,
  //     null,
  //     true
  //   );

  //   return courses;
  // }

  async coursesBoardAdmin(
    input: CourseFilterByAdminInput = {},
    sort: CourseSortInput | CoursesSortSiteInput = {
      sortBy: CourseSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = {}
  ): Promise<{
    items: Course[];
    pageInfo: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasBefore: boolean;
    };
  }> {
    let lecturerId: string;

    if (input.userIdOfLecturer) {
      const lecturer = await this.lecturerService.findLecturerByUserIdOrError(
        input.userIdOfLecturer
      );
      lecturerId = lecturer.lecturer.id;
    }

    const systemShareSubquery = `
      (
        SELECT COALESCE(SUM("LearningProgramRevenueShares"."systemShare"), 0)
        FROM "LearningProgramRevenueShares"
        INNER JOIN "Transactions" ON "LearningProgramRevenueShares"."transactionId" = "Transactions"."id"
        INNER JOIN "Courses" ON "LearningProgramRevenueShares"."programId" = "Courses"."id"
        WHERE "LearningProgramRevenueShares"."programId" = "Courses"."id"
        AND "LearningProgramRevenueShares"."programType" = '${LearningProgramTypeEnum.COURSE}'
        AND "Transactions"."status" = 'SUCCESS'
      )`;

    const order: Order = [
      [
        sort.sortBy === CourseSortEnum.PROFIT ?
          Sequelize.literal(systemShareSubquery)
        : Sequelize.col(sort.sortBy),
        sort.sortType || SortTypeEnum.DESC
      ]
    ];

    const where: WhereOptions<Course> = {
      ...(input.type && { type: input.type }),
      ...(input.userIdOfLecturer && {
        courseLecturers: {
          lecturerId
        }
      }),
      ...(input.courseStatus === CourseStatusFilter.DRAFTS && {
        isCreatedByAdmin: true
      }),
      ...(input.isLiveCourse !== undefined && {
        isLiveCourse: input.isLiveCourse
      }),
      ...(input.categoryId && { categoryId: input.categoryId }),
      ...(input.publicationStatus && {
        publicationStatus: input.publicationStatus
      }),
      ...(input.syllabusCreationMethod && {
        syllabusCreationMethod: input.syllabusCreationMethod
      }),
      status:
        input.courseStatus ?
          CourseFinalStatus[input.courseStatus]
        : CourseFinalStatus[CourseStatusFilter.PUBLISHED],
      ...(input.status && { status: input.status }),
      ...(input.searchKey && {
        [Op.or]: [
          { code: { [Op.iLike]: `%${input.searchKey}%` } },
          { arTitle: { [Op.iLike]: `%${input.searchKey}%` } },
          { enTitle: { [Op.iLike]: `%${input.searchKey}%` } }
        ]
      }),
      ...(input['level'] && { level: input['level'] })
    };

    const allCourses = await this.courseRepo.findAll(
      where,
      [
        { model: CourseDetail, required: false, attributes: [] },
        {
          model: CourseLecturer,
          required: false,
          include: [
            {
              model: Lecturer,
              required: false,
              include: [
                {
                  model: User,
                  required: false
                }
              ]
            }
          ]
        }
      ],
      order
    );

    // Remove duplicates by course.id
    const uniqueCoursesMap = new Map<string, Course>();
    allCourses.forEach(course => {
      uniqueCoursesMap.set(course.id, course);
    });

    const uniqueCourses = Array.from(uniqueCoursesMap.values());

    const page = paginate.page || 1;
    const limit = paginate.limit || 8;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const sortedCourses = uniqueCourses.slice(startIndex, endIndex);

    return {
      items: sortedCourses,
      pageInfo: {
        page,
        limit,
        totalCount: uniqueCourses.length,
        totalPages: Math.ceil(uniqueCourses.length / limit),
        hasNext: page * limit < uniqueCourses.length,
        hasBefore: page > 1
      }
    };
  }

  coursesBoardLecturer(
    input: CourseFilterByLecturerInput = {},
    sort: CourseSortInput = {
      sortBy: CourseSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = {},
    lecturerId: string
  ): Promise<PaginationRes<Course>> {
    // Subquery to calculate the system share for each course
    //TODO: fix type
    const lecturerShareSubquery = `
      (
        SELECT COALESCE(SUM("LearningProgramRevenueShares"."lecturerShare"), 0)
        FROM "LearningProgramRevenueShares"
        WHERE "LearningProgramRevenueShares"."programId" = "Course"."id"
        AND "LearningProgramRevenueShares"."programType" = '${LearningProgramTypeEnum.COURSE}'
      )`;

    // Apply sorting
    const order = [
      [
        sort.sortBy === CourseSortEnum.REVENUE ?
          Sequelize.literal(lecturerShareSubquery)
        : Sequelize.col(sort.sortBy),
        sort.sortType || SortTypeEnum.DESC
      ]
    ];

    const result = this.courseRepo.findPaginated(
      {
        ...(input.type && { type: input.type }),
        ...(input.courseStatus === CourseStatusFilter.DRAFTS && {
          isCreatedByAdmin: false
        }),
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.publicationStatus && {
          publicationStatus: input.publicationStatus
        }),
        ...(input.syllabusCreationMethod && {
          syllabusCreationMethod: input.syllabusCreationMethod
        }),
        status:
          input.courseStatus ?
            CourseFinalStatus[input.courseStatus]
          : CourseFinalStatus[CourseStatusFilter.PUBLISHED],
        ...(input.status && {
          status: input.status
        }),
        ...(input.searchKey && {
          [Op.or]: [
            { code: { [Op.iLike]: `%${input.searchKey}%` } },
            { arTitle: { [Op.iLike]: `%${input.searchKey}%` } },
            { enTitle: { [Op.iLike]: `%${input.searchKey}%` } }
          ]
        }),
        ...(typeof input.isLiveCourse === 'boolean' && {
          isLiveCourse: input.isLiveCourse
        })
      },
      order,
      paginate.page,
      paginate.limit,
      [
        { model: CourseDetail, attributes: [] },
        {
          model: CourseLecturer,
          where: {
            lecturerId
          }
        }
      ]
    );

    // console.log(result);

    return result;
  }
  // helper function to remove duplicates by id
  private removeDuplicates<T extends { id: any }>(items: T[]): T[] {
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  async learningProgramsExplore(
    sort: ExploreSort = {
      sortBy: ExploreSortByEnum.UPDATED_AT,
      sortType: SortTypeEnum.DESC
    },
    popularCoursesLimit = 4,
    latestWorkshopsLimit = 4,
    pathDiplomasLimit = 4,
    subscriptionDiplomasLimit = 4,
    liveCoursesLimit = 4
  ): Promise<LearningProgramsExplore> {
    const order = this.buildOrder(sort);

    const [courses, diplomas] = await Promise.all([
      this.courseRepo.findAll(
        {
          status: CourseStatusEnum.APPROVED,
          publicationStatus: PublicationStatusEnum.PUBLIC
        },
        [
          {
            model: CourseLecturer,
            required: true,
            include: [{ model: Lecturer }]
          }
        ],
        order
      ),

      this.diplomaRepo.findAll(
        {
          status: DiplomaStatusEnum.APPROVED,
          publicationStatus: PublicationStatusEnum.PUBLIC,
          diplomaType: [DiplomaTypeEnum.PATH, DiplomaTypeEnum.SUBSCRIPTION]
        },
        [],
        order
      )
    ]);

    // Courses
    const uniqueCourses = this.removeDuplicates(courses);

    const popularCourses = uniqueCourses
      .filter(c => !c.isLiveCourse && c.type === CourseTypeEnum.COURSE)
      .slice(0, popularCoursesLimit);

    const latestWorkshops = uniqueCourses
      .filter(c => !c.isLiveCourse && c.type === CourseTypeEnum.WORKSHOP)
      .slice(0, latestWorkshopsLimit);

    const liveCourses = uniqueCourses
      .filter(c => c.isLiveCourse)
      .slice(0, liveCoursesLimit);

    // Diplomas
    const uniqueDiplomas = this.removeDuplicates(diplomas);

    const pathDiplomas = uniqueDiplomas
      .filter(d => d.diplomaType === DiplomaTypeEnum.PATH)
      .slice(0, pathDiplomasLimit);

    const subscriptionDiplomas = uniqueDiplomas
      .filter(d => d.diplomaType === DiplomaTypeEnum.SUBSCRIPTION)
      .slice(0, subscriptionDiplomasLimit);

    return {
      popularCourses,
      latestWorkshops,
      pathDiplomas,
      subscriptionDiplomas,
      liveCourses
    };
  }

  async mostPopularCourses(
    limit: number = 4,
    sort: ExploreSort = {
      sortBy: ExploreSortByEnum.UPDATED_AT,
      sortType: SortTypeEnum.DESC
    }
  ): Promise<Course[]> {
    try {
      const orderBy =
        sort.sortBy && sort.sortType ?
          `"${sort.sortBy}" ${sort.sortType}`
        : `"updatedAt" DESC`;

      const mostPopular: Array<Course & { assignedUserCount: number }> =
        await this.sequelize.query(
          `
          SELECT c.*, COUNT(uac."userId") AS "assignedUserCount"
          FROM public."Courses" c
          LEFT JOIN public."UsersAssignments" uac ON c."id" = uac."courseId"
          WHERE c."status" = :status
          AND c."publicationStatus" = :publicationStatus
          AND c."type" = :type
          AND c."isLiveCourse" = :isLiveCourse
          GROUP BY c."id"
          ORDER BY "assignedUserCount" DESC, ${orderBy};
          `,
          {
            replacements: {
              status: CourseStatusEnum.APPROVED,
              publicationStatus: PublicationStatusEnum.PUBLIC,
              type: CourseTypeEnum.COURSE,
              isLiveCourse: false
            },
            type: QueryTypes.SELECT
          }
        );

      const unique = this.removeDuplicates(mostPopular);
      return unique.slice(0, limit);
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  private buildOrder(sort: ExploreSort): string {
    const field = sort.sortBy || ExploreSortByEnum.UPDATED_AT;
    const direction = sort.sortType || SortTypeEnum.DESC;
    return `${direction === SortTypeEnum.DESC ? '-' : ''}${field}`;
  }

  async courses(
    filter: GeneralSearchFilter = {},
    sort: CourseSortInput | CoursesSortSiteInput = {
      sortBy: CourseSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = {
      page: 1,
      limit: 15
    }
  ): Promise<PaginationRes<Course>> {
    const whereCondition = {
      status: CourseStatusEnum.APPROVED,
      ...(filter?.excludedIds && {
        id: { [Op.notIn]: filter?.excludedIds }
      }),
      ...(filter?.type && {
        type: filter?.type.toUpperCase() as unknown as CourseTypeEnum
      }),
      ...(filter?.isLiveCourse !== undefined && {
        isLiveCourse: filter?.isLiveCourse
      }),
      publicationStatus: PublicationStatusEnum.PUBLIC,
      ...(filter?.categoryIds && {
        categoryId: { [Op.in]: filter?.categoryIds }
      }),
      ...(filter?.level && { level: { [Op.in]: filter?.level } }),
      ...(filter?.price && {
        priceAfterDiscount: { [Op.gte]: filter?.price }
      }),
      ...(filter?.searchKey && {
        [Op.or]: [
          { enTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
          { arTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
          {
            '$courseLecturers.lecturer.user.arFullName$': {
              [Op.iLike]: `%${filter?.searchKey}%`
            }
          },
          {
            '$courseLecturers.lecturer.user.enFullName$': {
              [Op.iLike]: `%${filter?.searchKey}%`
            }
          },
          {
            '$courseLecturers.lecturer.user.code$': {
              [Op.iLike]: `%${filter?.searchKey}%`
            }
          },
          {
            '$category.enName$': {
              [Op.iLike]: `%${filter?.searchKey}%`
            }
          },
          {
            '$category.arName$': {
              [Op.iLike]: `%${filter?.searchKey}%`
            }
          }
        ]
      })
    };

    const order: Order = [
      [
        Sequelize.col(sort?.sortBy || 'createdAt'),
        sort?.sortType || SortTypeEnum.DESC
      ]
    ];

    const allCourses = await this.courseRepo.findAll(
      whereCondition,
      [
        {
          model: CourseLecturer,
          as: 'courseLecturers',
          required: true,
          include: [
            {
              model: Lecturer,
              where: {
                ...(filter?.lecturerId && {
                  id: filter?.lecturerId
                })
              },
              as: 'lecturer',
              include: [{ model: User, as: 'user' }]
            }
          ]
        },
        {
          model: Category,
          as: 'category'
        }
      ],
      order
    );

    const uniqueCoursesMap = new Map<string, Course>();
    allCourses.forEach(course => {
      uniqueCoursesMap.set(course.id, course);
    });

    const uniqueCourses = Array.from(uniqueCoursesMap.values());

    const page = paginate.page || 1;
    const limit = paginate.limit || 15;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCourses = uniqueCourses.slice(startIndex, endIndex);

    return {
      items: paginatedCourses,
      pageInfo: {
        page,
        limit,
        totalCount: uniqueCourses.length,
        totalPages: Math.ceil(uniqueCourses.length / limit),
        hasNext: page * limit < uniqueCourses.length,
        hasBefore: page > 1
      }
    };
  }

  async privateCourses(
    filter: GeneralSearchFilter = {},
    sort: CourseSortInput | CoursesSortSiteInput = {
      sortBy: CourseSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = {
      page: 1,
      limit: 15
    },
    user: User = null
  ): Promise<PaginationRes<Course>> {
    if (!user)
      return {
        items: [],
        pageInfo: {
          totalCount: 0,
          page: paginate.page,
          limit: paginate.limit,
          hasBefore: false,
          hasNext: false
        }
      };

    return await this.courseRepo.findPaginated(
      {
        status: CourseFinalStatus[CourseStatusFilter.PUBLISHED],
        publicationStatus: PublicationStatusEnum.PRIVATE,
        ...(filter?.searchKey && {
          [Op.or]: [
            { enTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
            { arTitle: { [Op.iLike]: `%${filter?.searchKey}%` } }
          ]
        }),
        ...(filter?.categoryIds && {
          categoryId: filter?.categoryIds
        }),
        ...(filter?.level && { level: filter?.level }),
        ...(filter?.price && {
          priceAfterDiscount: { [Op.gte]: filter?.price }
        })
      },
      [
        [
          Sequelize.col(sort?.sortBy || 'createdAt'),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginate?.page,
      paginate?.limit,
      [
        {
          model: UsersAssignment,
          where: {
            userId: user?.id
          }
        }
      ]
    );
  }

  async recommendedCourses(
    courseId: string,
    programType: CourseTypeEnum,
    isLive: boolean
  ): Promise<Course[]> {
    const course = await this.courseRepo.findOne({
      id: courseId,
      type: programType
    });

    if (!course) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
    }

    //---------------------- category id
    let recommendedCourses: Course[];
    recommendedCourses = await this.courseRepo.findAll(
      {
        id: { [Op.not]: courseId },
        categoryId: course.categoryId,
        type: programType,
        publicationStatus: PublicationStatusEnum.PUBLIC,
        status: CourseStatusEnum.APPROVED,
        isLiveCourse: isLive
      },
      [],
      [[this.sequelize.col('createdAt'), SortTypeEnum.DESC]]
    );
    if (recommendedCourses.length < 4) {
      //---------------------- users count
      recommendedCourses = await this.courseRepo.findAll(
        {
          id: { [Op.not]: courseId },
          publicationStatus: PublicationStatusEnum.PUBLIC,
          type: programType,
          status: CourseStatusEnum.APPROVED,
          isLiveCourse: isLive
        },
        [
          {
            model: CourseDetail,
            as: 'courseDetail'
          }
        ],
        [
          [
            this.sequelize.col('courseDetail.enrolledUsersCount'),
            SortTypeEnum.DESC
          ]
        ]
      );
      if (recommendedCourses.length < 4) {
        //---------------------- most recent
        recommendedCourses = await this.courseRepo.findAll(
          {
            id: { [Op.not]: courseId },
            publicationStatus: PublicationStatusEnum.PUBLIC,
            type: programType,
            status: CourseStatusEnum.APPROVED,
            isLiveCourse: isLive
          },
          [],
          [[this.sequelize.col('createdAt'), SortTypeEnum.DESC]]
        );
      }
    }
    return recommendedCourses.slice(0, 4);
  }
  validatePriceBeforeAndAfterDiscount(input: {
    originalPrice: number;
    priceAfterDiscount?: number;
  }): void {
    const isFreeWithDiscount =
      !input.originalPrice && input.priceAfterDiscount != null;
    const isDiscountValueMore =
      input.priceAfterDiscount != null &&
      input.priceAfterDiscount >= input.originalPrice;

    if (isFreeWithDiscount || isDiscountValueMore)
      throw new BaseHttpException(ErrorCodeEnum.INVALID_DISCOUNT);
  }

  // private async createCourse(
  //   input: CreateDraftedCourseByLecturerInput,
  //   // lecturerId?: string
  // ): Promise<Course> {
  //   let sectionsCount = 0,
  //     articlesCount = 0,
  //     videosCount = 0,
  //     lessonsCount = 0,
  //     collection: Collection;

  //   if (input.categoryId)
  //     await this.categoryService.activeCategoryOrError(input.categoryId);

  //   this.validatePriceBeforeAndAfterDiscount({
  //     originalPrice: input.originalPrice,
  //     priceAfterDiscount: input.priceAfterDiscount
  //   });

  //   // if (
  //   //   input.syllabusCreationMethod ===
  //   //     SyllabusCreationMethodEnum.EXTERNAL_LINK &&
  //   //   input.sectionsInput?.length
  //   // ) {
  //   //   throw new BaseHttpException(ErrorCodeEnum.EXTERNAL_LINK_COURSE);
  //   // }

  //   if (input.collectionId) {
  //     collection = await this.collectionRepo.findOne({
  //       id: input.collectionId
  //     });

  //     if (!collection) {
  //       throw new BaseHttpException(ErrorCodeEnum.COLLECTION_NOT_EXISTS);
  //     }
  //   }

  //   const course = await this.courseRepo.createOne({
  //     id: Ulid.generate().toRaw(),
  //     ...input,
  //     // priceAfterDiscount: input.priceAfterDiscount || input.originalPrice,
  //     ...(lecturerId && { lecturerId }),
  //     // type: CourseTypeEnum.COURSE,
  //     code: await this.helperService.generateModelCodeWithPrefix(
  //       CodePrefix.COURSE,
  //       this.courseRepo
  //     )
  //   });

  //   await this.skillService.setSkills(course, input.skillsIds);

  //   await this.toolService.setTools(course, input.toolsIds);

  //   await this.setCourseUploadedFilesReferences(course);

  //   try {
  //     if (input.sectionsInput?.length > 0) {
  //       const { sections, lessons } =
  //         await this.sectionService.createCourseSectionsAndLessons(
  //           course,
  //           input.sectionsInput
  //         );

  //       sectionsCount = sections.length;

  //       articlesCount = sections.reduce(
  //         (acc, sec) => acc + sec.articlesCount,
  //         0
  //       );

  //       videosCount = sections.reduce((acc, sec) => acc + sec.videosCount, 0);

  //       lessonsCount = lessons.length;
  //     }
  //   } catch (error) {
  //     console.log('error: ', error);
  //     throw new BaseHttpException(ErrorCodeEnum.INVALID_SECTIONS_INPUT);
  //   }

  //   const courseDetail = await this.courseDetailsRepo.createOne({
  //     ...input,
  //     courseId: course.id,
  //     ...(input.status === CourseStatusEnum.PENDING && {
  //       requestSubmittedAt: new Date()
  //     }),
  //     ...(input.status === CourseStatusEnum.APPROVED && {
  //       approvedAt: new Date()
  //     }),
  //     sectionsCount,
  //     articlesCount,
  //     videosCount,
  //     lessonsCount
  //   });
  //   await this.setCourseDetailsUploadedFilesReferences(courseDetail);

  //   if (course.collectionId) {
  //     await this.bunnyService.updateCollectionName(
  //       course.collectionId,
  //       course.enTitle,
  //       course.type as unknown as UploadedVideoLibrary
  //     );
  //   }

  //   if (collection)
  //     await this.collectionRepo.updateOneFromExistingModel(collection, {
  //       hasReference: true,
  //       ...(course.enTitle && { name: course.enTitle })
  //     });
  //   return course;
  // }

  private async createCourse(
    input: CreateDraftedCourseByLecturerInput & {
      lecturersInput?: CourseLecturerInput[];
    },
    fallbackLecturer?: Lecturer
  ): Promise<Course> {
    let sectionsCount = 0,
      articlesCount = 0,
      videosCount = 0,
      lessonsCount = 0,
      liveSessionsCount = 0,
      quizzesCount = 0,
      collection: Collection;

    // validate course lessons inputs
    await this.validateCourseLessonsInputs(input);

    if (input.categoryId) {
      await this.categoryService.activeCategoryOrError(input.categoryId);
    }

    this.validatePriceBeforeAndAfterDiscount({
      originalPrice: input.originalPrice,
      priceAfterDiscount: input.priceAfterDiscount
    });

    // Validate lecturer commissions if provided
    if (input.lecturersInput?.length > 0) {
      const { vatPercentage, paymentGatewayVatPercentage } =
        await this.getVatValues();
      this.validateLecturerCommissions(
        input.priceAfterDiscount ?? input.originalPrice,
        input.lecturersInput,
        vatPercentage,
        paymentGatewayVatPercentage
      );
    }

    if (input.collectionId) {
      collection = await this.collectionRepo.findOne({
        id: input.collectionId
      });

      if (!collection) {
        throw new BaseHttpException(ErrorCodeEnum.COLLECTION_NOT_EXISTS);
      }
    }

    const course = await this.courseRepo.createOne({
      id: Ulid.generate().toRaw(),
      ...input,
      code: await this.helperService.generateModelCodeWithPrefix(
        CodePrefix.COURSE,
        this.courseRepo
      )
    });

    // Set course lecturers
    if (input.lecturersInput?.length > 0) {
      for (const lecturer of input.lecturersInput) {
        const lecturerUser =
          await this.lecturerService.validateLecturerForCourseCreation(
            lecturer.userIdOfLecturer
          );

        await this.courseLecturersRepo.createOne({
          courseId: course.id,
          lecturerId: lecturerUser.lecturer.id,
          commission: lecturer.commission,
          commissionType: lecturer.commissionType
        });
      }
    } else if (fallbackLecturer) {
      const lecturerData = await this.lecturerRepo.findOne({
        id: fallbackLecturer.id
      });
      await this.courseLecturersRepo.createOne({
        courseId: course.id,
        lecturerId: lecturerData.id,
        commission: lecturerData.commissionPercentage,
        commissionType: CommissionType.PERCENTAGE
      });
    } else {
      if (
        input.status !== CourseStatusEnum.DRAFTED &&
        input.status !== CourseStatusEnum.PREVIEWED
      )
        throw new BaseHttpException(ErrorCodeEnum.COURSE_MUST_HAVE_LECTURER);
    }

    await this.skillService.setSkills(course, input.skillsIds);
    await this.toolService.setTools(course, input.toolsIds);
    await this.setCourseUploadedFilesReferences(course);

    try {
      if (input.sectionsInput?.length > 0) {
        const { sections, lessons } =
          await this.sectionService.createCourseSectionsAndLessons(
            course,
            input.sectionsInput
          );

        sectionsCount = sections.length;
        articlesCount = sections.reduce(
          (acc, sec) => acc + sec.articlesCount,
          0
        );
        videosCount = sections.reduce((acc, sec) => acc + sec.videosCount, 0);
        liveSessionsCount = sections.reduce(
          (acc, sec) => acc + sec.liveSessionsCount,
          0
        );

        quizzesCount = sections.reduce((acc, sec) => acc + sec.quizzesCount, 0);

        lessonsCount = lessons.length;
      }
    } catch (error) {
      console.log('error: ', error);
      throw new BaseHttpException(ErrorCodeEnum.INVALID_SECTIONS_INPUT);
    }

    const courseDetail = await this.courseDetailsRepo.createOne({
      ...input,
      courseId: course.id,
      ...(input.status === CourseStatusEnum.PENDING && {
        requestSubmittedAt: new Date()
      }),
      ...(input.status === CourseStatusEnum.APPROVED && {
        approvedAt: new Date()
      }),
      sectionsCount,
      articlesCount,
      liveSessionsCount,
      videosCount,
      lessonsCount,
      quizzesCount,
      ...(input.aceApprovedCourseNumber && {
        aceApprovedCourseNumber: input.aceApprovedCourseNumber
      }),
      ...(input.acePresentName && { acePresentName: input.acePresentName }),
      ...(input.aceDaysToGetCertified && {
        acePresentTitle: input.aceDaysToGetCertified
      }),
      ...(input.aceCecsAwarded && { aceCecsAwarded: input.aceCecsAwarded }),
      ...(input.aceSlug && { aceSlug: input.aceSlug })
    });

    await this.setCourseDetailsUploadedFilesReferences(courseDetail);

    if (course.collectionId) {
      await this.bunnyService.updateCollectionName(
        course.collectionId,
        course.enTitle,
        // course.type as unknown as UploadedVideoLibrary
        UploadedVideoLibrary.COURSE
      );
    }

    if (collection) {
      await this.collectionRepo.updateOneFromExistingModel(collection, {
        hasReference: true,
        ...(course.enTitle && { name: course.enTitle })
      });
    }

    return course;
  }

  async setCourseUploadedFilesReferences(
    course: Course,
    transaction?: Transaction
  ): Promise<void> {
    if (course.thumbnail)
      await this.uploaderService.setUploadedFilesReferences(
        [course.thumbnail],
        'Course',
        'thumbnail',
        course.id,
        transaction
      );
  }

  async setCourseDetailsUploadedFilesReferences(
    courseDetail: CourseDetail,
    transaction?: Transaction
  ): Promise<void> {
    if (courseDetail.promoVideo)
      await this.uploaderService.setUploadedFilesReferences(
        [courseDetail.promoVideo],
        'CourseDetail',
        'promoVideo',
        courseDetail.id,
        transaction
      );

    if (courseDetail.outcomes?.length)
      await this.uploaderService.setUploadedFilesReferences(
        courseDetail.outcomes,
        'CourseDetail',
        'outcomes',
        courseDetail.id,
        transaction
      );
  }

  async courseBoardAdmin(courseId: string): Promise<Course> {
    const course = await this.courseRepo.findOne({ id: courseId });
    if (
      !course ||
      (course.status === CourseStatusEnum.DRAFTED && !course.isCreatedByAdmin)
    )
      throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
    return course;
  }

  async courseBoardLecturer(
    courseId: string,
    currentUser: User
  ): Promise<Course> {
    const whereCondition: any = { id: courseId };

    if (currentUser.role === UserRoleEnum.LECTURER) {
      whereCondition['$courseLecturers.lecturerId$'] = currentUser.lecturer.id;
    }

    const course = await this.courseRepo.findOne(whereCondition, [
      {
        model: CourseLecturer,
        include: [
          {
            model: Lecturer,
            attributes: ['id'],
            include: [{ model: User }]
          }
        ]
      },
      { model: Category },
      { model: CourseDetail }
    ]);

    if (
      !course ||
      (course.status === CourseStatusEnum.DRAFTED && course.isCreatedByAdmin)
    ) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
    }

    return course;
  }

  async courseUsersBoard(
    courseId: string,
    filter: CourseUserFilterInput,
    sort: CourseUserSortInput = {
      sortBy: UserCourseSortEnum.LAST_ACTIVE_AT,
      sortType: SortTypeEnum.DESC
    },
    paginator: PaginatorInput = { limit: 10 }
  ): Promise<PaginationRes<User>> {
    const courseWithUsers = await this.usersAssignmentsRepo.findAll(
      {
        courseId,
        ...(filter?.progress === CourseUserFilterEnum.COMPLETED && {
          completed: true
        })
      },
      [
        {
          model: User,
          attributes: [
            'id',
            'firstName',
            'lastName',
            'profilePicture',
            'email',
            'code',
            'lastActiveAt',
            'createdAt'
          ]
        }
      ]
    );

    const where: any = {
      id: { [Op.in]: courseWithUsers.map(user => user.userId) },
      ...(filter?.isBlocked !== undefined && { isBlocked: filter.isBlocked }),
      ...(filter?.isDeleted !== undefined && { isDeleted: filter.isDeleted })
    };

    if (filter?.searchKey) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${filter.searchKey}%` } },
        { lastName: { [Op.iLike]: `%${filter.searchKey}%` } },
        { arFullName: { [Op.iLike]: `%${filter.searchKey}%` } },
        { enFullName: { [Op.iLike]: `%${filter.searchKey}%` } },
        { email: { [Op.iLike]: `%${filter.searchKey}%` } },
        { code: { [Op.iLike]: `%${filter.searchKey}%` } }
      ];
    }

    const users = await this.userRepo.findPaginated(
      where,
      [[sort.sortBy, sort.sortType]],
      paginator.page,
      paginator.limit
    );

    return users;
  }

  async courseUsers(courseId: string): Promise<UsersAssignment[]> {
    return this.usersAssignmentsRepo.findAll({ courseId });
  }

  async courseInfo(courseId: string): Promise<Course> {
    const course = await this.courseRepo.findOne({ id: courseId }, [
      {
        model: CourseDetail,
        attributes: ['id', 'articlesCount', 'videosCount', 'enAbout']
      },
      {
        model: CourseLecturer,
        include: [{ model: Lecturer, include: [{ model: User }] }]
      }
    ]);
    if (!course) throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
    return course;
  }

  async coursePreviewSite(courseId: string, userId: string): Promise<Course> {
    const lecturer =
      await this.lecturerService.findLecturerByUserIdOrError(userId);

    const courseLecturer = await this.courseLecturersRepo.findOne({
      courseId,
      lecturerId: lecturer.lecturer.id
    });

    if (!courseLecturer) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
    }

    const course = await this.courseRepo.findOne({ id: courseId });

    if (!course) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
    }

    return course;
  }

  async publishDraftedCourseByAdmin(
    input: PublishDraftedCourseAdminInput
  ): Promise<Course> {
    if (!input.lecturersInput?.length) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_MUST_HAVE_LECTURER);
    }

    // Validate lecturers
    const validatedLecturers = await Promise.all(
      input.lecturersInput.map(async lecturerInput => {
        const lecturerUser =
          await this.lecturerService.validateLecturerForCourseCreation(
            lecturerInput.userIdOfLecturer
          );
        return {
          id: lecturerUser.lecturer.id,
          commissionPercentage: lecturerInput.commission,
          commissionType: lecturerInput.commissionType
        };
      })
    );

    const course = await this.publishDraftedCourse({
      ...input,
      isCreatedByAdmin: true,
      status: CourseStatusEnum.APPROVED,
      lecturersInput: validatedLecturers
    });

    await Promise.all(
      validatedLecturers.map(({ id }) =>
        this.lecturerRepo.updateOne({ id }, { lastCourseCreatedAt: new Date() })
      )
    );

    if (course.publicationStatus === PublicationStatusEnum.PUBLIC) {
      const courseDetails = await this.courseDetailsRepo.findOne({
        courseId: course.id
      });

      try {
        await this.sendEmailsAndSiteNotificationsToUsers(
          course,
          EmailToUsersTypeEnum.NEW_PROGRAM_AVAILABLE,
          null,
          courseDetails.promoVideo
        );
      } catch (e) {
        console.log(e);
      }
    }

    return course;
  }

  async publishDraftedCourseByLecturer(
    input: PublishDraftedCourseLecturerInput,
    currentUser: User
  ): Promise<Course> {
    return await this.publishDraftedCourse({
      ...input,
      isCreatedByAdmin: false,
      status: CourseStatusEnum.PENDING,
      lecturersInput: [
        {
          id: currentUser.lecturer.id,
          commissionPercentage: currentUser.lecturer.commissionPercentage
        }
      ]
    });
  }

  async publishDraftedCourse(
    input: PublishDraftedCourseLecturerInput & {
      lecturersInput?: {
        id: string;
        commissionPercentage: number;
        commissionType?: CommissionType;
      }[];
    }
  ): Promise<Course> {
    const course = await this.courseRepo.findOne({ id: input.courseId }, [
      CourseDetail,
      Skill,
      Tool
    ]);

    if (!course) throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);

    if (
      !(
        course.status === CourseStatusEnum.DRAFTED ||
        course.status === CourseStatusEnum.PENDING
      )
    )
      throw new BaseHttpException(ErrorCodeEnum.COURSE_NOT_DRAFTED);

    if (course.isCreatedByAdmin !== input.isCreatedByAdmin)
      throw new BaseHttpException(ErrorCodeEnum.INVALID_COURSE_OWNER);

    await this.validateCourseLessonsInputs(input);

    if (input.lecturersInput?.length > 0) {
      const coursePrice =
        input.priceAfterDiscount ??
        course.priceAfterDiscount ??
        input.originalPrice ??
        course.originalPrice;

      const { vatPercentage, paymentGatewayVatPercentage } =
        await this.getVatValues();

      this.validateLecturerCommissions(
        coursePrice,
        input.lecturersInput.map(l => ({
          userIdOfLecturer: l.id,
          commission: l.commissionPercentage,
          commissionType: l.commissionType
        })),
        vatPercentage,
        paymentGatewayVatPercentage
      );
    }

    this.validateCourseSections(CourseStatusEnum.APPROVED, input.sectionsInput);

    const uniqueSlug = await this.generateUniqueSlug(course, input.enTitle);

    return await this.sequelize.transaction(async transaction => {
      await this.courseRepo.updateOneFromExistingModel(
        course,
        {
          ...input,
          slug: uniqueSlug
        },
        transaction
      );

      await this.courseDetailsRepo.updateOneFromExistingModel(
        course.courseDetail,
        {
          ...input,
          ...(input.status === CourseStatusEnum.PENDING && {
            requestSubmittedAt: new Date()
          }),
          ...(input.status === CourseStatusEnum.APPROVED && {
            approvedAt: new Date()
          })
        },
        transaction
      );

      // Update tools
      if (
        input?.toolsIds?.length !== course?.tools?.length ||
        !course?.tools.every(tool => input?.toolsIds.includes(tool.id))
      ) {
        await this.toolService.setTools(course, input.toolsIds, transaction);
      }

      // Update skills
      if (
        input?.skillsIds?.length !== course?.skills?.length ||
        !course.skills.every(skill => input.skillsIds.includes(skill.id))
      ) {
        await this.skillService.setSkills(course, input.skillsIds, transaction);
      }

      await this.setCourseUploadedFilesReferences(course, transaction);

      await this.setCourseDetailsUploadedFilesReferences(
        course.courseDetail,
        transaction
      );

      // Recreate sections & lessons and recalculate counts
      if (input?.sectionsInput?.length > 0) {
        await this.sectionService.deleteDraftedCourseSections(input.courseId);

        const { sections, lessons } =
          await this.sectionService.createCourseSectionsAndLessons(
            course,
            input.sectionsInput,
            transaction
          );

        const sectionsCount = sections.length;

        const articlesCount = sections.reduce(
          (acc, sec) => acc + sec.articlesCount,
          0
        );

        const videosCount = sections.reduce(
          (acc, sec) => acc + sec.videosCount,
          0
        );

        const liveSessionsCount = sections.reduce(
          (acc, sec) => acc + sec.liveSessionsCount,
          0
        );

        const quizzesCount = sections.reduce(
          (acc, sec) => acc + sec.quizzesCount,
          0
        );

        const lessonsCount = lessons.length;

        await this.courseDetailsRepo.updateOneFromExistingModel(
          course.courseDetail,
          {
            sectionsCount,
            articlesCount,
            videosCount,
            liveSessionsCount,
            quizzesCount,
            lessonsCount
          },
          transaction
        );
      }

      // Handle deleted sections & lessons (if passed)
      if (input?.sectionsToDelete?.length) {
        await this.sectionRepo.deleteAll(
          { id: input.sectionsToDelete },
          transaction
        );
      }

      if (input?.lessonsToDelete?.length) {
        await this.lessonRepo.deleteAll(
          { id: input.lessonsToDelete },
          transaction
        );
      }

      // Set lecturers
      if (input?.lecturersInput?.length) {
        await this.courseLecturersRepo.deleteAll(
          { courseId: course.id },
          transaction
        );

        for (const lecturer of input.lecturersInput) {
          await this.courseLecturersRepo.createOne(
            {
              courseId: course.id,
              lecturerId: lecturer.id,
              commission: lecturer.commissionPercentage,
              commissionType:
                lecturer.commissionType ?? CommissionType.PERCENTAGE
            },
            transaction
          );
        }
      }

      return course;
    });
  }

  async courseOrError(
    courseId?: string,
    status?: CourseStatusEnum[],
    slug?: string
  ): Promise<Course> {
    if (!courseId && !slug) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    const where: any = {};

    if (courseId) {
      where.id = courseId;
    } else if (slug) {
      where.slug = slug;
    }

    if (status && status.length) {
      where.status = { [Op.in]: status };
    }

    const include: Includeable[] = [
      Section,
      { model: CourseLecturer, include: [Lecturer] }
    ];

    const course = await this.courseRepo.findOne(where, include);

    if (!course) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
    }

    return course;
  }

  async replyCourseRequest(input: ReplyCourseRequest): Promise<Course> {
    const course = await this.courseOrError(input.courseId);
    if (
      !CourseFinalStatus[CourseStatusFilter.SUBMISSIONS].includes(course.status)
    )
      throw new BaseHttpException(ErrorCodeEnum.CANNOT_CHANGE_APPROVAL_STATUS);
    if (input.status === ReplyRequestStatusEnum.APPROVED) {
      await this.helperService.validateDto(
        CourseDto,
        course.get({ plain: true })
      );
    }
    // console.log(course?.courseSections?.[0]?.id);

    // here i need to validate that there is a syllabus
    const firsSectionLessons = await this.lessonRepo.findAll({
      ...(course?.courseSections?.[0]?.id && {
        sectionId: course?.courseSections?.[0]?.id
      })
    });

    if (
      !course?.courseSections ||
      !firsSectionLessons ||
      !(course?.courseSections?.length > 0) ||
      !(firsSectionLessons?.length > 0)
    ) {
      throw new BaseHttpException(ErrorCodeEnum.SYLLABUS_SHOULD_NOT_BE_EMPTY);
    }

    const updatedCourse = await this.sequelize.transaction(
      async transaction => {
        await this.courseDetailsRepo.updateOne(
          { courseId: input.courseId },
          {
            ...(input.status === ReplyRequestStatusEnum.REJECTED ?
              {
                rejectReason: input.rejectReason
              }
            : {
                approvedAt: new Date(),
                rejectReason: null
              })
          },
          transaction
        );

        const updatedCourse = await this.courseRepo.updateOne(
          { id: input.courseId },
          {
            status: <CourseStatusEnum>(<unknown>input.status)
          },
          transaction
        );

        return updatedCourse;
      }
    );

    //send email and notification to the lecturer if his course has been approved or rejected
    void this.sendEmailAndSiteNotificationToLecturer(input);
    return updatedCourse;
  }

  async sendEmailAndSiteNotificationToLecturer(
    input: ReplyCourseRequest
  ): Promise<void> {
    const course = await this.courseOrError(input.courseId);

    const courseLecturers = await this.courseLecturersRepo.findAll(
      {
        courseId: course.id
      },
      [
        {
          model: Lecturer
        }
      ]
    );

    const lecturerUserIds = courseLecturers.map(cl => cl.lecturer.userId);

    const lecturersUsers = await this.userRepo.findAll(
      {
        id: lecturerUserIds
      },
      [],
      [],
      ['email', 'firstName', 'id', 'enFullName']
    );

    const sendNotificationsToLecturer = async (lecturerUser: User) => {
      switch (input.status) {
        case ReplyRequestStatusEnum.APPROVED: {
          const programTypeHeader =
            course.type.charAt(0).toUpperCase() +
            course.type.slice(1).toLowerCase();
          const programType = course.type.toLowerCase();
          await this.mailService.send({
            to: lecturerUser.email,
            template: 'puplication-approval',
            subject: `Congratulations! Your ${programTypeHeader} Has Been Approved`,
            templateData: {
              url: 'https://instructor.leiaqa.com',
              lecturerName:
                lecturerUser?.firstName ??
                lecturerUser?.enFullName?.split(' ')[0],
              programTitle: course.enTitle,
              programTypeHeader,
              programType
            }
          });

          await this.siteNotificationsService.createSiteNotification(
            SiteNotificationsTypeEnum.PUBLICATION_APPROVAL,
            {
              userId: lecturerUser.id,
              programArTitle: course.arTitle,
              programEnTitle: course.enTitle,
              programId: course.id
            }
          );

          if (course.publicationStatus === PublicationStatusEnum.PUBLIC) {
            const courseDetails = await this.courseDetailsRepo.findOne({
              courseId: course.id
            });
            await this.sendEmailsAndSiteNotificationsToUsers(
              course,
              EmailToUsersTypeEnum.NEW_PROGRAM_AVAILABLE,
              null,
              courseDetails.promoVideo
            );
          }
          break;
        }
        case ReplyRequestStatusEnum.REJECTED: {
          await this.mailService.send({
            to: lecturerUser.email,
            template: 'puplication-rejection',
            subject: `Important Update on Your ${course.type.charAt(0).toUpperCase() + course.type.slice(1).toLowerCase()} Submission`,
            templateData: {
              rejectionReason: input.rejectReason,
              lecturerName:
                lecturerUser?.firstName ??
                lecturerUser?.enFullName.split(' ')[0],
              programTitle: course.enTitle,
              programType: course.type.toLowerCase(),
              programTypeHeader:
                course.type.charAt(0).toUpperCase() +
                course.type.slice(1).toLowerCase()
            }
          });

          await this.siteNotificationsService.createSiteNotification(
            SiteNotificationsTypeEnum.PUBLICATION_REJECTION,
            {
              userId: lecturerUser.id,
              programArTitle: course.arTitle,
              programEnTitle: course.enTitle
            }
          );
          break;
        }
      }
    };

    await Promise.all(lecturersUsers.map(sendNotificationsToLecturer));
  }

  async updateCourseBoardByAdmin(
    input: UpdateCourseByAdminInput,
    currentUser: User,
    tempToken?: string
  ): Promise<Course> {
    // Validate lecturers without transforming their shape
    if (input.lecturersInput?.length) {
      await Promise.all(
        input.lecturersInput.map(async lecturer => {
          await this.lecturerService.validateLecturerForCourseCreation(
            lecturer.userIdOfLecturer
          );
        })
      );
    }

    const updatedCourse = await this.updateCourse(input, currentUser);

    await this.updataDiplomasPublicationStatus(updatedCourse.id);
    return updatedCourse;
  }

  async updateCourseBoardByLecturer(
    input: UpdateCourseByLecturerInput,
    currentUser: User
  ): Promise<Course> {
    const updatedCourse = await this.updateCourse(
      input,
      currentUser,
      currentUser.lecturer
    );
    await this.updataDiplomasPublicationStatus(updatedCourse.id);
    return updatedCourse;
  }

  async updateCourse(
    input: UpdateCourseByAdminInput,
    currentUser: User,
    currentLecturer?: Lecturer
  ): Promise<Course> {
    const { originalPrice, priceAfterDiscount, lecturersInput, courseId } =
      input;

    let sectionsCount = 0,
      articlesCount = 0,
      videosCount = 0,
      lessonsCount = 0,
      liveSessionsCount = 0,
      quizzesCount = 0;

    let course = await this.courseOrError(courseId);

    await this.validateCourseLessonsInputsForUpdate(input);

    this.validateCourseSections(course.status, input.sections);
    this.validatePriceBeforeAndAfterDiscount({
      originalPrice: originalPrice ?? course.originalPrice,
      priceAfterDiscount: priceAfterDiscount ?? course.priceAfterDiscount
    });

    if (input.lecturersInput?.length > 0) {
      const price =
        input.priceAfterDiscount ??
        priceAfterDiscount ??
        input.originalPrice ??
        originalPrice;
      const { vatPercentage, paymentGatewayVatPercentage } =
        await this.getVatValues();
      this.validateLecturerCommissions(
        price,
        input.lecturersInput,
        vatPercentage,
        paymentGatewayVatPercentage
      );
    }

    let priceToBeUsedForImpacts: number | undefined;

    if (priceAfterDiscount) priceToBeUsedForImpacts = priceAfterDiscount;
    else if (!priceAfterDiscount && !course.priceAfterDiscount && originalPrice)
      priceToBeUsedForImpacts = originalPrice;

    if (priceToBeUsedForImpacts) {
      await this.validateDiplomasPricingAfterCoursePriceUpdate(
        courseId,
        priceToBeUsedForImpacts
      );
      await this.pricingCalcsQueue.add('ApplyTheImpactOfCoursePriceChange', {
        changedCourse: course,
        changedPrice: priceToBeUsedForImpacts
      });
      await this.pricingCalcsQueue.add(
        'ApplyTheImpactOfProgramPriceChangeOnCarts',
        {
          progamId: course.id,
          oldPrice: course.priceAfterDiscount ?? course.originalPrice,
          newPrice: priceToBeUsedForImpacts
        }
      );
    }

    if (input.categoryId) {
      await this.categoryService.categoryOrError(input.categoryId);
    }

    if (input.skillsIds?.length) {
      await this.courseSkillRepo.deleteAll({ courseId });
      const skills = await this.skillRepo.findAll({ id: input.skillsIds });
      if (skills.length !== input.skillsIds.length)
        throw new BaseHttpException(ErrorCodeEnum.SKILL_DOESNT_EXIST);
      await this.courseSkillRepo.bulkCreate(
        input.skillsIds.map(skillId => ({ courseId, skillId }))
      );
    }

    if (input.toolsIds?.length) {
      await this.courseToolRepo.deleteAll({ courseId });
      const tools = await this.toolRepo.findAll({ id: input.toolsIds });
      if (tools.length !== input.toolsIds.length)
        throw new BaseHttpException(ErrorCodeEnum.TOOL_DOESNT_EXIST);
      await this.courseToolRepo.bulkCreate(
        input.toolsIds.map(toolId => ({ courseId, toolId }))
      );
    }

    if (!this.isUserAllowedToUpdateCourse(course, currentUser, input))
      throw new BaseHttpException(ErrorCodeEnum.UPDATE_COURSE_NOT_ALLOWED);

    const coursePriceBeforeUpdate = course.priceAfterDiscount;
    let videosToDeleteFromStorage = [];

    course = await this.sequelize.transaction(async transaction => {
      try {
        if (input.sections?.length) {
          const { lessons, sections } =
            await this.sectionService.updateCourseSectionsAndLessons(
              course,
              input.sections,
              transaction
            );

          sectionsCount = sections.length;

          articlesCount = sections.reduce(
            (acc, sec) => acc + sec.articlesCount,
            0
          );
          videosCount = sections.reduce((acc, sec) => acc + sec.videosCount, 0);
          liveSessionsCount = sections.reduce(
            (acc, sec) => acc + sec.liveSessionsCount,
            0
          );

          quizzesCount = sections.reduce(
            (acc, sec) => acc + sec.quizzesCount,
            0
          );

          lessonsCount = lessons.length;
        }
      } catch (e) {
        console.log('error when update course sections and lessons ❌❌❌');
        console.log('error message', e.message);
        console.log('error stack', e.stack);
      }

      if (input.lessonsToDelete?.length || input.sectionsToDelete?.length) {
        videosToDeleteFromStorage =
          await this.sectionService.deleteLessonsAndSections(
            input.lessonsToDelete,
            input.sectionsToDelete,
            transaction
          );
        const updatedSections =
          await this.sectionService.updateCourseSectionsAttributes(
            course.id,
            transaction
          );
        if (Array.isArray(updatedSections) && updatedSections.length > 0) {
          const updatedLessons = await this.lessonRepo.findAll({
            sectionId: updatedSections.map(s => s.id)
          });
          sectionsCount = updatedSections.length;
          articlesCount = updatedSections.reduce(
            (acc, sec) => acc + (sec.articlesCount || 0),
            0
          );
          videosCount = updatedSections.reduce(
            (acc, sec) => acc + (sec.videosCount || 0),
            0
          );
          liveSessionsCount = updatedSections.reduce(
            (acc, sec) => acc + sec.liveSessionsCount,
            0
          );

          quizzesCount = updatedSections.reduce(
            (acc, sec) => acc + sec.quizzesCount,
            0
          );
          lessonsCount = updatedLessons.length;
        } else {
          sectionsCount = 0;
          articlesCount = 0;
          videosCount = 0;
          lessonsCount = 0;
          liveSessionsCount = 0;
          quizzesCount = 0;
        }
      }

      const updatedCourseDetails = await this.courseDetailsRepo.updateOne(
        { courseId },
        {
          ...input,
          ...(sectionsCount > 0 && {
            articlesCount,
            videosCount,
            lessonsCount,
            liveSessionsCount,
            quizzesCount,
            sectionsCount
          })
        },
        transaction
      );

      await this.changeLogRepo.createOne(
        {
          courseId,
          changedBy: currentUser.role,
          changeReason: input.changeReason
        },
        transaction
      );

      // Handle lecturers assignment
      if (lecturersInput?.length) {
        const existingLecturers = await this.courseLecturersRepo.findAll({
          courseId
        });
        const existingMap = new Map(
          existingLecturers.map(l => [l.lecturerId, l])
        );

        for (const l of lecturersInput) {
          const lecturerUser =
            await this.lecturerService.validateLecturerForCourseCreation(
              l.userIdOfLecturer
            );
          const existing = existingMap.get(lecturerUser.lecturer.id);

          if (existing) {
            if (
              existing.commission !== l.commission ||
              existing.commissionType !== l.commissionType
            ) {
              await this.courseLecturersRepo.updateOne(
                { id: existing.id },
                { commission: l.commission, commissionType: l.commissionType },
                transaction
              );
            }
            existingMap.delete(lecturerUser.lecturer.id);
          } else {
            await this.courseLecturersRepo.createOne(
              {
                courseId,
                lecturerId: lecturerUser.lecturer.id,
                commission: l.commission,
                commissionType: l.commissionType
              },
              transaction
            );
          }
        }

        for (const [lecturerId, existing] of existingMap) {
          await this.courseLecturersRepo.deleteOne(
            { id: existing.id },
            transaction
          );
        }
      } else if (currentLecturer) {
        const isLecturerAssigned = await this.courseLecturersRepo.findOne({
          courseId,
          lecturerId: currentLecturer.id
        });

        if (!isLecturerAssigned) {
          throw new BaseHttpException(ErrorCodeEnum.PERMISSION_DENIED);
        }
      } else {
        if (course.status !== CourseStatusEnum.DRAFTED) {
          throw new BaseHttpException(ErrorCodeEnum.COURSE_MUST_HAVE_LECTURER);
        }
      }

      const returnedCourse = await this.courseRepo.updateOneFromExistingModel(
        course,
        {
          ...input,
          ...(!course.priceAfterDiscount &&
            input.priceAfterDiscount < 0 &&
            input.originalPrice && { priceAfterDiscount: input.originalPrice }),
          ...(course.status === CourseStatusEnum.REJECTED && {
            status: CourseStatusEnum.PENDING
          })
        },
        transaction
      );

      if (input.thumbnail) {
        await this.uploaderService.removeOldFilesReferences(
          [returnedCourse.thumbnail],
          [course.thumbnail],
          transaction
        );
        await this.setCourseUploadedFilesReferences(
          returnedCourse,
          transaction
        );
      }

      if (input.promoVideo || input.outcomes) {
        await this.setCourseDetailsUploadedFilesReferences(
          updatedCourseDetails,
          transaction
        );
      }

      return returnedCourse;
    });

    if (input.enTitle && course.collectionId) {
      await this.bunnyService.updateCollectionName(
        course.collectionId,
        input.enTitle,
        course.type as unknown as UploadedVideoLibrary
      );
      await this.collectionRepo.updateOne(
        { id: course.collectionId },
        { name: input.enTitle, hasReference: true }
      );
    }

    if (videosToDeleteFromStorage.length) {
      await this.deleteVideosFromStorage(
        videosToDeleteFromStorage,
        course.type
      );
    }

    if (
      course.publicationStatus === PublicationStatusEnum.PUBLIC &&
      coursePriceBeforeUpdate > course.priceAfterDiscount
    ) {
      void this.sendEmailsAndSiteNotificationsToUsers(
        course,
        EmailToUsersTypeEnum.PRICE_DISCOUNT,
        coursePriceBeforeUpdate
      );
    }
    return course;
  }

  async updataDiplomasPublicationStatus(courseId: string) {
    // get all diplomas for this course
    const diplomasIds = (
      await this.diplomaCoursesRepo.findAll({
        courseId,
        keptForOldAssignments: false
      })
    ).map(dc => dc.diplomaId);

    // for each diploma get all its courses
    diplomasIds.map(async diplomaId => {
      const diplomaCoursesIds: string[] = (
        await this.diplomaCoursesRepo.findAll({
          diplomaId,
          keptForOldAssignments: false
        })
      ).map(dc => dc.courseId);

      const courses = await this.courseRepo.findAll(
        {
          id: diplomaCoursesIds
        },
        [],
        [],
        ['id', 'publicationStatus']
      );

      // if all is private -> the diploma should be privateCourses
      // if at least one is public -> the diploma should be public
      const isPublic = courses.some(
        c => c.publicationStatus === PublicationStatusEnum.PUBLIC
      );
      await this.diplomaRepo.updateOne(
        {
          id: diplomaId
        },
        {
          publicationStatus:
            isPublic ?
              PublicationStatusEnum.PUBLIC
            : PublicationStatusEnum.PRIVATE
        }
      );
    });
  }

  async sendEmailsAndSiteNotificationsToUsers(
    course: Course,
    emailType: EmailToUsersTypeEnum,
    coursePriceBeforeUpdate?: number,
    videoId: string = null
  ) {
    let template: Templates,
      subject: string,
      url: string,
      newCourseDetails: CourseDetail;
    let users: User[] = [];

    if (emailType === EmailToUsersTypeEnum.NEW_PROGRAM_AVAILABLE) {
      template = 'new-learning-program';
      subject = 'New Learning Opportunity';
      url = `${process.env.WEBSITE_URL}/program/${course.slug}`;

      users = await this.userRepo.findAll(
        {
          role: UserRoleEnum.USER,
          email: { [Op.ne]: null },
          isBlocked: false,
          isDeleted: false
        },
        [],
        []
      );
      newCourseDetails = await this.courseDetailsRepo.findOne(
        {
          courseId: course.id
        },
        [],
        [],
        ['enSummary']
      );
    } else if (
      emailType === EmailToUsersTypeEnum.PRICE_DISCOUNT &&
      course.priceAfterDiscount < coursePriceBeforeUpdate
    ) {
      if (course.priceAfterDiscount >= coursePriceBeforeUpdate) {
        console.log(course.priceAfterDiscount, coursePriceBeforeUpdate);
        return;
      }

      template = 'offers-discount';
      subject = 'Special Discount on Your Selected Program!';
      url = `${process.env.WEBSITE_URL}/cart`;

      const cartIds = (
        await this.cartItemRepo.findAll(
          {
            learningProgramId: course.id,
            cartId: { [Op.ne]: null }
          },
          [],
          [],
          ['cartId']
        )
      ).map(ci => ci.cartId);

      users = await this.userRepo.findAll(
        {
          cartId: { [Op.in]: cartIds },
          email: { [Op.ne]: null },
          isBlocked: false,
          isDeleted: false
        },
        [],
        []
      );
    } else {
      return;
    }

    if (!users.length) return;

    for (const user of users) {
      const userName =
        user?.enFullName?.split(' ')[0] ?? user?.firstName ?? 'User';

      const templateData = {
        userName,
        programType:
          course?.type ?
            course.type.charAt(0).toUpperCase() +
            course.type.slice(1).toLowerCase()
          : undefined,
        programLevel: course?.level
          ?.toLowerCase()
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        learningTime: course?.learningTime,
        learningTimeUnit:
          course?.learningTimeUnit ?
            course.learningTimeUnit.toLowerCase() + 's'
          : undefined,
        programTitle: course?.enTitle,
        programImageUrl:
          course?.thumbnail ?
            `${
              process.env.NODE_ENV === 'development' ?
                'https://leiaqa.fra1.digitaloceanspaces.com/'
              : 'https://leiaqa-production.fra1.digitaloceanspaces.com/'
            }${course.thumbnail}`
          : undefined,
        programSummary:
          emailType === EmailToUsersTypeEnum.NEW_PROGRAM_AVAILABLE ?
            newCourseDetails?.enSummary
          : '',
        url: url
      };

      await this.mailService.send({
        to: user.email,
        template,
        subject,
        templateData
      });
    }

    // Prepare notifications
    const notificationType =
      emailType === EmailToUsersTypeEnum.PRICE_DISCOUNT ?
        NotificationTypeEnum.SPECIAL_DISCOUNT_OFFER
      : NotificationTypeEnum.NEW_LEARNING_PROGRAM_AVAILABLE;

    const notificationEnBody =
      emailType === EmailToUsersTypeEnum.PRICE_DISCOUNT ?
        `We noticed you left ${course.enTitle} in your cart. Grab this exclusive discount before it’s gone!`
      : `Explore our latest ${course.enTitle} programs and level up your skills today.`;

    const notificationArBody =
      emailType === EmailToUsersTypeEnum.PRICE_DISCOUNT ?
        `لاحظنا أنك تركت ${course.arTitle} في سلة التسوق الخاصة بك. اغتنم هذا الخصم الحصري قبل أن ينتهي!`
      : `اكتشف أحدث ${course.arTitle} لدينا وطور مهاراتك اليوم`;

    const notificationUrl =
      emailType === EmailToUsersTypeEnum.PRICE_DISCOUNT ?
        `${process.env.WEBSITE_URL}/cart`
      : `${process.env.WEBSITE_URL}/program/${course.slug}`;

    await this.pusherQueue.add('pusher', {
      toUsers: [...users.map(t => t.dataValues)],
      notificationParentId: course.id,
      notificationParentType: course.type,
      payloadData: {
        enTitle: `Leiaqa`,
        arTitle: `لياقة`,
        enBody: notificationEnBody,
        arBody: notificationArBody,
        url: notificationUrl,
        type: notificationType,
        notificationType: notificationType,
        videoId: videoId,
        targetId: course.id,
        TargetType: course.type,
        targetModel: course.type,
        targetType: course.type
      }
    });
  }

  async deleteVideosFromStorage(
    videoIds: string[],
    type: CourseTypeEnum
  ): Promise<void> {
    const videosUsed =
      await this.sectionService.findLessonsByVideoIds(videoIds);
    const unusedUrls =
      videosUsed.length > 0 ?
        videoIds.filter(id => !videosUsed.includes(id))
      : videoIds;

    // if (unusedUrls.length > 0) {
    //   await this.bunnyService.deleteVideos(
    //     unusedUrls,
    //     type as unknown as UploadedVideoLibrary
    //   );
    // }
  }

  async assignUsersToCourse(
    courseId: string,
    usersIds: string[],
    currentUser: User
  ): Promise<boolean> {
    // Retrieve the course or throw an error if it doesn't exist
    const course = await this.courseOrError(courseId);

    /*
    // Check if the current user is allowed to update the course
    // Uncomment this block if you need to enforce role-based access control
    if (
      !(
        (currentUser.role === UserRoleEnum.LECTURER &&
          course.lecturerId === currentUser?.lecturer?.id) ||
        currentUser.role === UserRoleEnum.ADMIN
      )
    ) {
      throw new BaseHttpException(ErrorCodeEnum.UPDATE_COURSE_NOT_ALLOWED);
    }
    */

    // Fetch user records from the database based on provided IDs
    const users = await this.userRepo.findAll({
      id: usersIds
    });

    // Ensure all user IDs exist in the database
    if (!users || users?.length !== usersIds?.length) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    // Find already assigned users to the course to avoid duplicates
    const userAssignedCourse = await this.usersAssignmentsRepo.findAll({
      courseId: course.id,
      userId: users.map(user => user.id)
    });

    // Filter out users who are not yet assigned to the course
    const unAssignedUsers = users.filter(
      user => !userAssignedCourse.some(uc => uc.userId === user.id)
    );

    // Bulk create user-course assignments for unassigned users
    await this.usersAssignmentsRepo.bulkCreate(
      unAssignedUsers.map(user => ({
        courseId: course.id,
        userId: user.id,
        isAssignedByAdmin: true
      }))
    );

    // Fetch all assigned users to update the enrolled users count
    const numberOfAssignedUsers = await this.usersAssignmentsRepo.findAll({
      courseId: course.id
    });

    // Update the course details with the new count of enrolled users
    await this.courseDetailsRepo.updateOne(
      { courseId: course.id },
      { enrolledUsersCount: numberOfAssignedUsers.length }
    );

    //todo as soon as possible
    // here i need to get all diplomas where (the course is part of AND in user's cart) , then calculate the adjusted price for this cartItem..
    // add this to job queue
    // const idsOfDiplomasWhereCourseIsPartOf = (
    //   await this.diplomaCoursesRepo.findAll(
    //     {
    //       courseId
    //     },
    //     [{ model: Diploma, required: true }]
    //   )
    // ).map(e => e.diploma.id);
    // for (const user of users) {
    //   //get user's cart.cartItems
    //   const cartItemsToAdjust = await this.cartItemRepo.findAll(
    //     {
    //       learningProgramId: idsOfDiplomasWhereCourseIsPartOf
    //     },
    //     [
    //       {
    //         model: Cart,
    //         required: true,
    //         where: {
    //           userId: user.id
    //         }
    //       }
    //     ]
    //   );

    //   for (const cartItem of cartItemsToAdjust) {
    //     // update the adjusted price for this cartItem
    //   }
    // }

    // Remove assigned course (and related diplomas) from user's cart
    for (const user of unAssignedUsers) {
      const cart = await this.cartRepo.findOne({ userId: user.id }, [
        { model: CartItem, as: 'cartItems' }
      ]);

      if (cart && cart.cartItems?.length > 0) {
        // get diplomas that contain this course
        const diplomaCourses = await this.diplomaCoursesRepo.findAll(
          { courseId: course.id },
          [{ model: Diploma, as: 'diploma' }]
        );
        const relatedDiplomaIds = diplomaCourses.map(dc => dc.diploma.id);

        // filter cart items: course itself OR related diplomas
        const assignedCartItems = cart.cartItems.filter(
          item =>
            item.learningProgramId === course.id ||
            relatedDiplomaIds.includes(item.learningProgramId)
        );

        for (const cartItem of assignedCartItems) {
          await this.cartService.deleteCartItem(user, cartItem.id);
        }
      }
    }

    //send notifications to the users that they are assigned to a course
    void this.sendNotificationsToUsers(users, course);

    // Return true to indicate successful operation
    return true;
  }

  //! depricated
  /**
   * @deprecated use assignLearningProgramsToUser instead
   */
  async assignLearingProgramsToUser_v1(
    userId: string,
    learningPrograms: LearningProgramInput[],
    diplomaId?: string,
    transaction?: Transaction
  ): Promise<boolean> {
    const user = await this.userRepo.findOne({
      id: userId,
      isDeleted: false,
      isBlocked: false
    });
    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);

    const coursesIds = learningPrograms
      .filter(
        learningProgram =>
          learningProgram.learningProgramType === LearningProgramTypeEnum.COURSE
      )
      .map(lp => lp.learningProgramId);

    if (coursesIds.length > 0) {
      const courses = await this.courseRepo.findAll({
        id: coursesIds
      });

      if (!courses || courses?.length !== coursesIds?.length) {
        throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
      }

      const alreadyAssignedCourses = (
        await this.usersAssignmentsRepo.findAll(
          {
            userId,
            courseId: coursesIds,
            ...(diplomaId && { diplomaId })
          },
          [
            {
              model: Course
            }
          ]
        )
      ).map(uc => uc.course);

      const notAssignedCourses = courses.filter(
        course => !alreadyAssignedCourses.some(c => c.id === course.id)
      );
      console.log('diplomaId', diplomaId);

      await this.usersAssignmentsRepo.bulkCreate(
        notAssignedCourses?.map(course => ({
          ...(diplomaId && { diplomaId }),
          courseId: course?.id,
          userId
        })),
        transaction
      );
      return true;
    }
  }

  //**********************************************************************************/

  @OnEvent(TRANSACTION_FULFILLED_EVENT, { async: true })
  @Transactional()
  async assignLearningProgramsToUser(
    event: AssignUserToLearningProgramEvent,
    sendAssigningNotification?: boolean,
    programsLimit: Boolean = false,
    isAssignedByAdmin: boolean = false
  ): Promise<boolean> {
    console.log('isAssignedByAdmin', isAssignedByAdmin);
    console.log('event triggered inside assignLearningProgramsToUser', event);
    const { userId, learningPrograms } = event;

    if (programsLimit) {
      if (learningPrograms.length > 10) {
        throw new BaseHttpException(ErrorCodeEnum.TOO_MANY_PROGRAMS);
      }
    }

    const user = await this.userRepo.findOne({
      id: userId,
      isDeleted: false,
      isBlocked: false
    });
    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);

    const courseIds: string[] = [];
    const diplomaIds: string[] = [];

    for (const learningProgram of learningPrograms) {
      if (
        learningProgram.learningProgramType ===
          LearningProgramTypeEnum.COURSE ||
        learningProgram.learningProgramType === LearningProgramTypeEnum.WORKSHOP
      ) {
        courseIds.push(learningProgram.learningProgramId);
      } else if (
        learningProgram.learningProgramType === LearningProgramTypeEnum.DIPLOMA
      ) {
        diplomaIds.push(learningProgram.learningProgramId);
      }
    }

    // check if already assigned to courses
    const alreadyAssignedCourses = await this.usersAssignmentsRepo.findAll({
      userId,
      courseId: courseIds
    });
    if (alreadyAssignedCourses.length > 0) {
      throw new BaseHttpException(
        ErrorCodeEnum.USER_ALREADY_ASSIGNED_TO_COURSE
      );
    }

    // check if already assigned to diplomas
    const alreadyAssignedDiplomas = await this.usersAssignmentsRepo.findAll({
      userId,
      diplomaId: diplomaIds
    });
    if (alreadyAssignedDiplomas.length > 0) {
      throw new BaseHttpException(
        ErrorCodeEnum.USER_ALREADY_ASSIGNED_TO_DIPLOMA
      );
    }

    if (courseIds.length > 0) {
      for (const courseId of courseIds) {
        const courseDetail = await this.courseDetailsRepo.findOne(
          { courseId: courseId },
          [],
          [],
          ['id', 'courseId', 'enrolledUsersCount']
        );

        if (courseDetail) {
          courseDetail.enrolledUsersCount += 1;
          await courseDetail.save();
        }
      }

      await this.assignCoursesToUser(
        userId,
        courseIds,
        undefined,
        sendAssigningNotification,
        isAssignedByAdmin
      );
    }

    if (diplomaIds.length > 0) {
      await this.assignDiplomasToUser(
        userId,
        diplomaIds,
        sendAssigningNotification,
        isAssignedByAdmin
      );

      for (const diplomaId of diplomaIds) {
        const diplomaDetail = await this.diplomaDetailsRepo.findOne({
          diplomaId
        });
        if (!diplomaDetail) continue;

        diplomaDetail.enrolledUsersCount =
          (diplomaDetail.enrolledUsersCount || 0) + 1;
        await diplomaDetail.save();

        const diplomaCourses = await this.diplomaCoursesRepo.findAll(
          { diplomaId, keptForOldAssignments: false },
          [
            {
              model: Course,
              include: [{ model: CourseDetail }]
            }
          ]
        );

        for (const { course } of diplomaCourses) {
          if (course?.courseDetail) {
            course.courseDetail.enrolledUsersCount =
              (course.courseDetail.enrolledUsersCount || 0) + 1;
            await course.courseDetail.save();
          }
        }
      }
    }

    // Remove assigned learning programs from user's cart
    const allAssignedIds = [...courseIds, ...diplomaIds];
    if (allAssignedIds.length > 0) {
      const cart = await this.cartRepo.findOne({ userId }, [
        { model: CartItem, as: 'cartItems' }
      ]);

      if (cart && cart.cartItems?.length > 0) {
        const assignedCartItems = cart.cartItems.filter(item =>
          allAssignedIds.includes(item.learningProgramId)
        );

        for (const cartItem of assignedCartItems) {
          await this.cartService.deleteCartItem(user, cartItem.id);
        }
      }
    }

    return true;
  }

  async assignCoursesToUser(
    userId: string,
    coursesIds: string[],
    diplomaId?: string,
    sendAssigningNotification?: boolean,
    isAssignedByAdmin: boolean = false,
    accessExpiresAt?: Date | null
  ): Promise<void> {
    const [user, courses] = await Promise.all([
      this.userRepo.findOne({
        id: userId,
        isDeleted: false,
        isBlocked: false
      }),
      this.courseRepo.findAll({ id: coursesIds })
    ]);

    if (!user) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    if (!courses || courses.length !== coursesIds.length) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
    }

    /**
     * 1️) Get already assigned courses
     *    - under same diploma
     *    - or without diploma
     */
    const alreadyAssignedCourses = (
      await this.usersAssignmentsRepo.findAll(
        {
          userId,
          courseId: coursesIds,
          ...(diplomaId && { diplomaId: [diplomaId, null] })
        },
        [{ model: Course }]
      )
    ).map(assignment => assignment.course);

    const notAssignedCourses = courses.filter(
      course => !alreadyAssignedCourses.some(ac => ac.id === course.id)
    );

    if (!notAssignedCourses.length) return;

    /**
     * 2️) Send notifications
     */
    if (sendAssigningNotification) {
      notAssignedCourses.forEach(course =>
        this.sendNotificationsToUsers([user], course)
      );
    }

    /**
     * 3️) Get previous progress for these courses
     *    (regardless of completed status)
     */
    const previousAssignments = await this.usersAssignmentsRepo.findAll({
      userId,
      courseId: coursesIds
    });

    /**
     * 4️) Build progress map (courseId → max progress)
     */
    const progressMap = new Map<
      string,
      { completedLessons: number; completed: boolean }
    >();

    for (const assignment of previousAssignments) {
      const existing = progressMap.get(assignment.courseId);

      if (
        !existing ||
        assignment.completedLessons > existing.completedLessons
      ) {
        progressMap.set(assignment.courseId, {
          completedLessons: assignment.completedLessons,
          completed: assignment.completed
        });
      }
    }

    /**
     * 5️) Assign courses with preserved progress
     */
    await this.usersAssignmentsRepo.bulkCreate(
      notAssignedCourses.map(course => {
        const progress = progressMap.get(course.id);

        return {
          ...(diplomaId && { diplomaId }),
          courseId: course.id,
          userId,
          completed: progress?.completed ?? false,
          completedLessons: progress?.completedLessons ?? 0,
          isAssignedByAdmin,
          accessExpiresAt
        };
      })
    );
  }
  async assignDiplomasToUser(
    userId: string,
    diplomasIds: string[],
    sendAssigningNotification?: boolean,
    isAssignedByAdmin: boolean = false
  ): Promise<void> {
    const diplomas = await this.diplomaRepo.findAll({
      id: diplomasIds
    });
    if (!diplomas || diplomas?.length !== diplomasIds?.length) {
      throw new BaseHttpException(ErrorCodeEnum.DIPLOMA_DOESNT_EXIST);
    }
    const idsOfDiplomasWhereUserIsAlreadyAssigned = (
      await this.usersAssignmentsRepo.findAll({
        userId,
        diplomaId: diplomasIds
      })
    ).map(uc => uc.diplomaId);

    const idsOfDiplomasWhereUserIsNOtAssigned = diplomasIds.filter(
      diplomaId => !idsOfDiplomasWhereUserIsAlreadyAssigned.includes(diplomaId)
    );

    if (idsOfDiplomasWhereUserIsNOtAssigned.length > 0) {
      for (const id of idsOfDiplomasWhereUserIsNOtAssigned) {
        await this.assignDiplomaToUser(
          userId,
          id,
          sendAssigningNotification,
          isAssignedByAdmin
        );
      }
    }
  }

  async assignDiplomaToUser(
    userId: string,
    diplomaId: string,
    sendAssigningNotification?: boolean,
    isAssignedByAdmin: boolean = false
  ): Promise<void> {
    const diplomaCoursesIds = (
      await this.diplomaCoursesRepo.findAll({
        diplomaId,
        keptForOldAssignments: false
      })
    ).map(dc => dc.courseId);

    // send Notifications
    const diploma = await this.diplomaRepo.findOne({ id: diplomaId });
    const accessExpiresAt = this.calculateAccessExpirationDate(
      diploma?.accessDurationPerMonths
    );

    if (sendAssigningNotification) {
      this.sendNotificationsToUsersForDiploma(diploma, [userId]);
    }

    await this.assignCoursesToUser(
      userId,
      diplomaCoursesIds,
      diplomaId,
      sendAssigningNotification,
      isAssignedByAdmin,
      accessExpiresAt
    );

    //  New logic: Check if user already completed all diploma courses
    // const userCompletedCourses = await this.usersAssignmentsRepo.findAll({
    //   userId,
    //   courseId: diplomaCoursesIds,
    //   completed: true
    // });

    // // if user has completed all courses in the diploma before joining it
    // if (userCompletedCourses.length === diplomaCoursesIds.length) {
    //   const user = await this.userRepo.findOne({ id: userId });

    //   // check if user already has diploma certification
    //   const existingCert = await this.certificationRepo.findOne({
    //     userId,
    //     learningProgramId: diplomaId,
    //     learningProgramType: UpperCaseLearningProgramTypeEnum.DIPLOMA
    //   });

    //   if (!existingCert) {
    //     const courseCert = await this.certificationRepo.findOne({
    //       userId,
    //       learningProgramType: UpperCaseLearningProgramTypeEnum.COURSE,
    //       learningProgramId: diplomaCoursesIds[0]
    //     });

    //     const enUserNameFromCourse = courseCert?.enUserName;
    //     const arUserNameFromCourse = courseCert?.arUserName;
    //     await this.certificationService.createCertification({
    //       userId,
    //       learningProgramId: diplomaId,
    //       learningProgramType: UpperCaseLearningProgramTypeEnum.DIPLOMA,
    //       enName: enUserNameFromCourse,
    //       arName: arUserNameFromCourse
    //     });
    //   }
    // }
  }

  //**********************************************************************************/

  @OnEvent(TRANSACTION_REFUNDED_EVENT, { async: true })
  @Transactional()
  async unassignUserFromLearningProgram(
    event: AssignUserToLearningProgramEvent
  ): Promise<boolean> {
    const { userId, learningPrograms, diplomaId } = event;

    const user = await this.userRepo.findOne({
      id: userId,
      isDeleted: false,
      isBlocked: false
    });

    if (!user) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    const courseIds: string[] = [];
    const diplomaIds: string[] = [];

    for (const lp of learningPrograms) {
      if (
        lp.learningProgramType === LearningProgramTypeEnum.COURSE ||
        lp.learningProgramType === LearningProgramTypeEnum.WORKSHOP
      ) {
        courseIds.push(lp.learningProgramId);
      }

      if (lp.learningProgramType === LearningProgramTypeEnum.DIPLOMA) {
        diplomaIds.push(lp.learningProgramId);
      }
    }

    // 1️) Remove course assignments FIRST
    if (courseIds.length) {
      const whereCondition: any = {
        userId,
        courseId: courseIds
      };

      if (diplomaId) {
        whereCondition.diplomaId = diplomaId;
      }

      await this.usersAssignmentsRepo.deleteAll(whereCondition);
    }

    // 2️) Decide cleanup AFTER deletion
    if (courseIds.length) {
      const coursesToCleanup: string[] = [];

      for (const courseId of courseIds) {
        const shouldCleanup = await this.shouldCleanupCourseData(
          userId,
          courseId
        );

        if (shouldCleanup) {
          coursesToCleanup.push(courseId);
        }
      }

      if (coursesToCleanup.length) {
        await this.cleanupUserCourseData(userId, coursesToCleanup);
      }
    }

    // 3️) Update course counters
    if (courseIds.length) {
      const courseDetails = await this.courseDetailsRepo.findAll(
        { courseId: courseIds },
        [],
        [],
        ['id', 'enrolledUsersCount']
      );

      for (const courseDetail of courseDetails) {
        courseDetail.enrolledUsersCount = Math.max(
          0,
          courseDetail.enrolledUsersCount - 1
        );
        await courseDetail.save();
      }
    }

    // 4️) Handle diploma unassign
    if (diplomaIds.length) {
      const diplomaDetails = await this.diplomaDetailsRepo.findAll(
        { diplomaId: diplomaIds },
        [],
        [],
        ['id', 'enrolledUsersCount']
      );

      for (const diplomaDetail of diplomaDetails) {
        diplomaDetail.enrolledUsersCount = Math.max(
          0,
          diplomaDetail.enrolledUsersCount - 1
        );
        await diplomaDetail.save();
      }

      await Promise.all(
        diplomaIds.map(diplomaId =>
          this.unassignUsersFromDiploma({
            diplomaId,
            usersIds: [userId]
          })
        )
      );
    }

    return true;
  }

  //---------------------

  async unassignUsersFromDiploma(
    input: AssignUsersToDiplomaInput
  ): Promise<boolean> {
    const assigned = await this.usersAssignmentsRepo.findAll({
      diplomaId: input.diplomaId,
      userId: { [Op.in]: input.usersIds }
    });

    const usersToUnassign = assigned.map(a => a.userId);
    if (usersToUnassign.length === 0) return true;

    const diplomaLearningPrograms = (
      await this.diplomaCoursesRepo.findAll(
        { diplomaId: input.diplomaId, keptForOldAssignments: false },
        [{ model: Course }]
      )
    ).map(lp => lp.course);

    await Promise.all(
      usersToUnassign.map(userId =>
        this.unassignUserFromLearningProgram({
          userId,
          diplomaId: input.diplomaId,
          learningPrograms: diplomaLearningPrograms.map(lp => ({
            learningProgramId: lp.id,
            learningProgramType: LearningProgramTypeEnum.COURSE
          }))
        })
      )
    );

    const diplomaDetail = await this.diplomaDetailsRepo.findOne({
      diplomaId: input.diplomaId
    });

    await this.diplomaDetailsRepo.updateOneFromExistingModel(diplomaDetail, {
      enrolledUsersCount:
        diplomaDetail.enrolledUsersCount - usersToUnassign.length
    });

    return true;
  }

  async unassignUserFromCourse(
    courseId: string,
    usersIds: string[],
    currentUser: User
  ): Promise<boolean> {
    const course = await this.courseOrError(courseId);

    const isAdmin = currentUser?.role === UserRoleEnum.ADMIN;

    let isLecturerOwner = false;
    if (currentUser?.lecturer?.id) {
      isLecturerOwner = !!(await this.courseLecturersRepo.findOne({
        courseId,
        lecturerId: currentUser.lecturer.id
      }));
    }

    if (!isLecturerOwner && !isAdmin) {
      throw new BaseHttpException(ErrorCodeEnum.UPDATE_COURSE_NOT_ALLOWED);
    }

    const users = await this.userRepo.findAll({ id: usersIds });

    if (!users || users.length !== usersIds.length) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    // Ensure users are not assigned to a diploma that contains this course
    for (const user of users) {
      const assignedToDiploma = await this.usersAssignmentsRepo.findOne({
        userId: user.id,
        diplomaId: { [Op.ne]: null },
        courseId
      });

      if (assignedToDiploma) {
        throw new BaseHttpException(
          ErrorCodeEnum.USER_ALREADY_ASSIGNED_TO_DIPLOMA_WITH_THIS_COURSE
        );
      }
    }

    // Clean up quiz attempts, answers, and lesson progress for each user
    for (const userId of usersIds) {
      await this.cleanupUserCourseData(userId, [courseId]);
    }

    // Remove users assignments from the course
    await this.usersAssignmentsRepo.deleteAll({
      courseId: course.id,
      userId: usersIds
    });

    // Recalculate enrolled users count
    const assignedUsers = await this.usersAssignmentsRepo.findAll({
      courseId: course.id
    });

    await this.courseDetailsRepo.updateOne(
      { courseId: course.id },
      { enrolledUsersCount: assignedUsers.length }
    );

    return true;
  }

  async markCourseAsCompleted(
    courseId: string,
    userId: string
  ): Promise<boolean> {
    // const course = await this.courseOrError(courseId);

    // if (!course.isCreatedByAdmin && course.lecturerId !== currentUser.id) {
    //   throw new BaseHttpException(ErrorCodeEnum.UPDATE_COURSE_NOT_ALLOWED);
    // }

    await this.usersAssignmentsRepo.updateAll(
      { courseId, userId },
      { completed: true }
    );

    /**
     * the frontEnd will see if the user has completed the course and hasnt the course certificate ,
     *  then user the createCertification mutation
     */

    // const courseType = (
    //   await this.courseRepo.findOne(
    //     {
    //       id: courseId
    //     },
    //     [],
    //     [],
    //     ['type']
    //   )
    // ).type;

    // await this.certificationService.createCertification({
    //   userId,
    //   learningProgramId: courseId,
    //   learningProgramType:
    //     courseType === CourseTypeEnum.COURSE ?
    //       UpperCaseLearningProgramTypeEnum.COURSE
    //     : UpperCaseLearningProgramTypeEnum.WORKSHOP
    // });

    // when the course is completed , then check if the the user has completed the diplomas which have this course , if it is true then create the diploma certification
    //await this.checkIfTheDiplomaIsCompleted(courseId, userId );

    return true;
  }

  async markCourseAsNotCompleted(
    courseId: string,
    userId: string
  ): Promise<boolean> {
    await this.usersAssignmentsRepo.updateAll(
      { courseId, userId },
      { completed: false }
    );

    return true;
  }

  async courseAssignedUsers(
    courseId: string,
    pagination: PaginatorInput = {}
  ): Promise<PaginationRes<UsersAssignment>> {
    const course = await this.courseOrError(courseId);

    const assignedUsers = await this.usersAssignmentsRepo.findPaginated(
      {
        courseId: course.id
      },
      '-createdAt',
      pagination.page,
      pagination.limit,
      [
        {
          model: User
        }
      ]
    );
    //TODO: check the type correctness ASAP @All
    assignedUsers.items = <UsersAssignment[]>(
      (<unknown>assignedUsers.items.map(assignedUser => assignedUser.user))
    );
    assignedUsers.pageInfo.totalCount = assignedUsers.items.length;
    return assignedUsers;
  }
  async diplomasWhereCourseIsPartOf(courseId: string): Promise<Diploma[]> {
    return (
      await this.diplomaCoursesRepo.findAll(
        {
          courseId: courseId,
          keptForOldAssignments: false
        },
        [
          {
            model: Diploma
          }
        ]
      )
    ).map(d => d.diploma);
  }
  async deleteCourse(courseId: string, currentUser: User): Promise<number> {
    console.log(currentUser.role);
    const course = (await this.courseRepo.findOne({ id: courseId }, [
      {
        model: Section,
        as: 'courseSections',
        attributes: ['id'],
        include: [{ model: Lesson, attributes: ['videoId'] }]
      },
      { model: CourseDetail, attributes: ['promoVideo'] }
    ])) as Course & { sections: Section[] };

    if (
      currentUser.role === UserRoleEnum.LECTURER &&
      course.status !== CourseStatusEnum.DRAFTED
    ) {
      throw new BaseHttpException(ErrorCodeEnum.DELETE_COURSE_NOT_ALLOWED);
    }

    if (!course) throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);

    const diplomasWhereCourseIsPartOf =
      await this.diplomasWhereCourseIsPartOf(courseId);

    if (diplomasWhereCourseIsPartOf.length > 0) {
      throw new BaseHttpException(ErrorCodeEnum.DELETE_COURSE_NOT_ALLOWED);
    }

    const deleterRole = currentUser?.role as UserRoleEnum;
    console.log('deleterRole', deleterRole);

    if (
      deleterRole === UserRoleEnum.ADMIN ||
      (deleterRole === UserRoleEnum.LECTURER &&
        course.status === CourseStatusEnum.DRAFTED)
    ) {
      {
        // this.bunnyService.deleteVideos(
        //   [
        //     course?.courseDetail?.promoVideo,
        //     ...(course?.sections
        //       ?.map(sec => sec?.lessons.map(lesson => lesson?.videoId))
        //       ?.flatMap(id => id) || [])
        //   ].filter(Boolean),
        //   course.type as unknown as UploadedVideoLibrary
        // );
        // try {
        //   await this.bunnyService.deleteCollection(
        //     course.collectionId,
        //     course.type as unknown as UploadedVideoLibrary
        //   );
        // } catch (error) {
        //   console.log(error.message);
        // }
        return await this.sequelize.transaction(async transaction => {
          await this.notificationsRepo.deleteAll(
            {
              targetId: courseId
            },
            transaction
          );

          await this.reportRepo.deleteAll(
            {
              targetId: courseId
            },
            transaction
          );

          // fetch cartItems and remove them via cartService
          const cartItems = await this.cartItemRepo.findAll(
            { learningProgramId: courseId },
            [{ model: Cart, required: true }]
          );

          for (const cartItem of cartItems) {
            const cart = await this.cartRepo.findOne({ id: cartItem.cartId });
            if (cart) {
              const user = await this.userRepo.findOne({
                id: cart.userId,
                isDeleted: false,
                isBlocked: false
              });
              if (user) {
                await this.cartService.deleteCartItem(user, cartItem.id);
              }
            }
          }

          return await this.courseRepo.deleteAll({ id: courseId }, transaction);
        });
      }
    } else {
      throw new BaseHttpException(ErrorCodeEnum.DELETE_COURSE_NOT_ALLOWED);
    }
  }

  async isUserEnrolledInCourse(
    courseId: string,
    userId: string
  ): Promise<boolean> {
    const userAssignedCourse = await this.usersAssignmentsRepo.findOne({
      courseId,
      userId
    });
    return !!userAssignedCourse;
  }

  private async isUserAllowedToUpdateCourse(
    course: Course,
    currentUser: User,
    input: UpdateCourseByAdminInput
  ): Promise<boolean> {
    if (currentUser.role !== UserRoleEnum.ADMIN) {
      const isLecturerOwner = await this.courseLecturersRepo.findOne({
        courseId: course.id,
        lecturerId: currentUser?.lecturer?.id
      });

      if (!isLecturerOwner) return false;
    }

    if (
      course.status === CourseStatusEnum.DRAFTED &&
      currentUser.role === UserRoleEnum.LECTURER &&
      course.isCreatedByAdmin
    )
      return false;

    if (
      ((input.priceAfterDiscount &&
        input.priceAfterDiscount !== course.priceAfterDiscount) ||
        (input.originalPrice &&
          input.originalPrice !== course.originalPrice)) &&
      currentUser.role === UserRoleEnum.LECTURER &&
      course.status === CourseStatusEnum.APPROVED
    )
      return false;

    return true;
  }

  async insideCourseSallabusSite(
    courseId: string,
    userId: string
  ): Promise<Course> {
    const isEnrolled = await this.isUserEnrolledInCourse(courseId, userId);
    if (!isEnrolled) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_NOT_ASSIGNED_TO_USER);
    }
    const course = await this.courseRepo.findOne(
      {
        id: courseId
        // status: CourseStatusEnum.APPROVED
      },
      [{ model: Section, include: [Lesson] }, { model: Category }]
    );

    if (!course) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
    }

    return course;
  }

  async courseResources(courseId: string): Promise<Course> {
    const course = await this.courseRepo.findOne({ id: courseId }, [Section]);

    if (!course) throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);

    return course;
  }

  async learningProgramsForAssigning(
    filter: LearningProgramFilterInput
  ): Promise<
    Array<
      {
        id: string;
        arTitle: string;
        enTitle: string;
        thumbnail: string;
      } & (
        | { learningProgramType: CourseTypeEnum }
        | { learningProgramType: UpperCaseLearningProgramTypeEnum }
      )
    >
  > {
    let userCoursesIds = [],
      userDiplomasIds = [],
      userAssignments = [];

    if (filter?.userId) {
      userAssignments = await this.usersAssignmentsRepo.findAll({
        userId: filter?.userId
      });

      userAssignments.forEach(ua => {
        if (ua?.courseId) {
          userCoursesIds.push(ua?.courseId);
        }
        if (ua?.diplomaId) {
          userDiplomasIds.push(ua?.diplomaId);
        }
      });

      userCoursesIds = [...new Set(userCoursesIds)];
      userDiplomasIds = [...new Set(userDiplomasIds)];
    }

    const courses = await this.courseRepo.findAll({
      status: CourseStatusEnum.APPROVED,
      id: {
        [Op.notIn]: userCoursesIds
      },
      ...(filter?.searchKey && {
        [Op.or]: [
          { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
          { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } }
        ]
      })
    });

    const diplomas = await this.diplomaRepo.findAll({
      status: CourseStatusEnum.APPROVED,
      id: {
        [Op.notIn]: userDiplomasIds
      },
      ...(filter?.searchKey && {
        [Op.or]: [
          { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
          { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } }
        ]
      })
    });

    const formattedCourses = courses.map(course => ({
      id: course.id,
      arTitle: course.arTitle,
      enTitle: course.enTitle,
      learningProgramType: course.type,
      thumbnail: course.thumbnail
    }));

    const formattedDiplomas = diplomas.map(diploma => ({
      id: diploma.id,
      arTitle: diploma.arTitle,
      enTitle: diploma.enTitle,
      learningProgramType: UpperCaseLearningProgramTypeEnum.DIPLOMA,
      thumbnail: diploma.thumbnail
    }));

    return [...formattedCourses, ...formattedDiplomas];
  }

  async learningProgramsForAssigningPaginated(
    filter: LearningProgramFilterInput,
    paginate?: PaginatorInput
  ) {
    let userCoursesIds = [],
      userDiplomasIds = [],
      userAssignments = [];

    if (filter?.userId) {
      userAssignments = await this.usersAssignmentsRepo.findAll({
        userId: filter?.userId
      });

      for (const ua of userAssignments) {
        if (ua?.courseId) userCoursesIds.push(ua.courseId);
        if (ua?.diplomaId) userDiplomasIds.push(ua.diplomaId);
      }

      userCoursesIds = [...new Set(userCoursesIds)];
      userDiplomasIds = [...new Set(userDiplomasIds)];
    }

    const whereCourses = {
      status: CourseStatusEnum.APPROVED,
      id: { [Op.notIn]: userCoursesIds },
      ...(filter?.searchKey && {
        [Op.or]: [
          { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
          { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } }
        ]
      })
    };

    const whereDiplomas = {
      status: CourseStatusEnum.APPROVED,
      id: { [Op.notIn]: userDiplomasIds },
      ...(filter?.searchKey && {
        [Op.or]: [
          { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
          { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } }
        ]
      })
    };

    // Pagination inputs
    const page = paginate?.page ?? 1;
    const limit = paginate?.limit ?? 15;
    const offset = (page - 1) * limit;

    // Fetch data
    const [courses, diplomas] = await Promise.all([
      this.courseRepo.findAll(whereCourses),
      this.diplomaRepo.findAll(whereDiplomas)
    ]);

    const totalCourses = courses.length;
    const totalDiplomas = diplomas.length;

    const formattedCourses = courses.map(course => ({
      id: course.id,
      arTitle: course.arTitle,
      enTitle: course.enTitle,
      thumbnail: course.thumbnail,
      learningProgramType: course.type,
      code: course.code
    }));

    const formattedDiplomas = diplomas.map(diploma => ({
      id: diploma.id,
      arTitle: diploma.arTitle,
      enTitle: diploma.enTitle,
      thumbnail: diploma.thumbnail,
      learningProgramType: UpperCaseLearningProgramTypeEnum.DIPLOMA,
      code: diploma.code
    }));

    // Merge
    const merged = [...formattedCourses, ...formattedDiplomas];
    const totalCount = totalCourses + totalDiplomas;

    // Paginate after merging
    const paginatedItems = merged.slice(offset, offset + limit);

    return {
      items: paginatedItems,
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

  async courseCommentsCount(courseId: string): Promise<number> {
    const comments = await this.commentRepo.findAll({
      courseId
    });
    return comments.length;
  }
  async assigned(programId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;
    return !!(await this.usersAssignmentsRepo.findOne({
      userId,
      courseId: programId
    }));
  }
  async courseUndrerDiplomaData(
    diplomaId: string,
    courseId: string
  ): Promise<CourseUnderDiplomaData> {
    const diplomaCourse = await this.diplomaCoursesRepo.findOne({
      diplomaId,
      courseId
    });

    return {
      commissionUnderDiploma: diplomaCourse?.commissionOfCourseUnderDiploma,
      priceUnderDiploma: diplomaCourse?.priceOfCourseUnderDiploma
    };
  }

  async getCoursesForDiploma(
    diplomaId: string,
    publicationStatus: PublicationStatusEnum
  ): Promise<Course[]> {
    const diplomaCourses = await this.diplomaCoursesRepo.findAll(
      {
        diplomaId,
        keptForOldAssignments: false
      },
      [
        {
          model: Course,
          where: {
            publicationStatus: {
              [Op.in]: [PublicationStatusEnum.PUBLIC, publicationStatus]
            }
          },
          // include: [{ model: Lecturer, include: [{ model: User }] }]
          include: [
            {
              model: CourseLecturer,
              include: [{ model: Lecturer, include: [{ model: User }] }]
            }
          ]
        }
      ]
    );

    return diplomaCourses.map(dc => dc.course);
  }

  async toggleCoursePublicationStatus(courseId: string): Promise<boolean> {
    const course = await this.courseRepo.findOne({ id: courseId });

    if (!course) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
    }

    await this.courseRepo.updateOneFromExistingModel(course, {
      publicationStatus:
        course.publicationStatus === PublicationStatusEnum.PUBLIC ?
          PublicationStatusEnum.PRIVATE
        : PublicationStatusEnum.PUBLIC
    });

    return true;
  }

  // async checkIfTheDiplomaIsCompleted(
  //   courseId: string,
  //   userId: string
  // ): Promise<boolean> {
  //   // find diplomas with the same courseId and userId
  //   const diplomIds = (
  //     await this.usersAssignmentsRepo.findAll(
  //       {
  //         courseId: courseId,
  //         userId: userId,
  //         diplomaId: { [Op.ne]: null }
  //       },
  //       [],
  //       [],
  //       ['diplomaId']
  //     )
  //   ).map(d => d.diplomaId);

  //   // if exist , then check if there is uncompletedCourse in this diploma
  //   if (diplomIds.length > 0) {
  //     diplomIds.map(async diplomId => {
  //       const uncompletedCourse = await this.usersAssignmentsRepo.findOne({
  //         diplomaId: diplomId,
  //         userId: userId,
  //         completed: false
  //       });

  //       // if all courses are completed then create the diploma certification
  //       if (!uncompletedCourse) {
  //         await this.certificationService.createCertification({
  //           userId,
  //           learningProgramId: diplomId,
  //           learningProgramType: UpperCaseLearningProgramTypeEnum.DIPLOMA
  //         });
  //       }
  //     });
  //   }

  //   return true;
  // }

  async sendNotificationsToUsers(users: User[], course: Course): Promise<void> {
    // for (const user of users) {
    //   await this.siteNotificationsService.createSiteNotification(
    //     SiteNotificationsTypeEnum.USER_ASSIGNED_TO_PROGRAM,
    //     {
    //       userId: user.id,
    //       programArTitle: course.arTitle,
    //       programEnTitle: course.enTitle,
    //       programId: course.id
    //     }
    //   );
    // }
    const courseDetail = await this.courseDetailsRepo.findOne(
      {
        courseId: course.id
      },
      [],
      [],
      ['promoVideo']
    );

    await this.pusherQueue.add('pusher', {
      toUsers: [...users.map(t => t.dataValues)],
      notificationParentId: course.id,
      notificationParentType: course.type,
      payloadData: {
        enTitle: `Leiaqa`,
        arTitle: `لياقة`,
        enBody: `Great news! The admin has assigned you to ${course.enTitle}. You can now access the course materials and start learning.`,
        arBody: `خبر رائع! تم إلحاقك بـ ${course.arTitle}. يمكنك الآن الوصول إلى محتويات الدورة والبدء في التعلم.`,
        url: `${process.env.WEBSITE_URL}/program/${course.slug}`,
        type: NotificationTypeEnum.USER_ASSIGNED_TO_PROGRAM,
        notificationType: NotificationTypeEnum.USER_ASSIGNED_TO_PROGRAM,
        videoId: courseDetail.promoVideo,
        targetId: course.id,
        TargetType: course.type,
        targetType: course.type,
        tagetModel: course.type
      }
    });
  }

  // private getUserUnassignedEventPayload(
  //   userId: string,
  //   learningProgramId: string,
  //   learningProgramType: UpperCaseLearningProgramTypeEnum
  // ): UnassignUserFromLearningProgramEvent {
  //   const event = new UnassignUserFromLearningProgramEvent();
  //   event.userId = userId;
  //   event.learningProgramId = learningProgramId;
  //   event.learningProgramType = learningProgramType;
  //   return event;
  // }
  async coursesForSiteMap() {
    const courses = await this.courseRepo.findAll(
      {
        publicationStatus: PublicationStatusEnum.PUBLIC,
        status: CourseStatusEnum.APPROVED
      },
      [],
      [],
      ['id', 'updatedAt', 'type']
    );

    const res = courses.map(c => {
      return { id: c.id, updatedAt: c.updatedAt, type: c.type };
    });
    console.log('debugging_______res', res, '______');
    return res;
  }

  async sendNotificationsToUsersForDiploma(
    diploma: Diploma,
    notAssignedUsersIds: string[]
  ) {
    const diplomaDetails = await this.diplomaDetailsRepo.findOne(
      {
        diplomaId: diploma.id
      },
      [],
      [],
      ['promoVideo']
    );

    const users = await this.userRepo.findAll({
      id: notAssignedUsersIds,
      email: { [Op.ne]: null }
    });

    await this.pusherQueue.add('pusher', {
      toUsers: [...users.map(t => t.dataValues)],
      notificationParentId: diploma.id,
      notificationParentType: NotificationParentTypeEnum.DIPLOMA,
      payloadData: {
        enTitle: `Leiaqa`,
        arTitle: `لياقة`,
        enBody: `Great news! The admin has assigned you to ${diploma.enTitle}. You can now access the course materials and start learning.`,
        arBody: `خبر رائع! تم إلحاقك بـ ${diploma.arTitle}. يمكنك الآن الوصول إلى محتويات الدورة والبدء في التعلم.`,
        url: `${process.env.WEBSITE_URL}/paths/${diploma.slug}`,
        type: NotificationTypeEnum.USER_ASSIGNED_TO_PROGRAM,
        notificationType: NotificationTypeEnum.USER_ASSIGNED_TO_PROGRAM,
        videoId: diplomaDetails.promoVideo,
        targetId: diploma.id,
        targetType: NotificationParentTypeEnum.DIPLOMA,
        TargetType: NotificationParentTypeEnum.DIPLOMA,
        targetModel: NotificationParentTypeEnum.DIPLOMA
      }
    });
  }
  async validateDiplomasPricingAfterCoursePriceUpdate(
    courseId: string,
    newCoursePrice: number
  ): Promise<Boolean> {
    // 1. get all diplomas where course is part of
    const diplomasWhereCourseIsPartOf: Diploma[] =
      await this.diplomasWhereCourseIsPartOf(courseId);

    for (const diploma of diplomasWhereCourseIsPartOf) {
      console.log('diploma name :', diploma.enTitle);
      console.log('-----------------------------------------------');
      // 2. get the diploma courses
      const diplomaCoursesWithoutTheUpdatedCourse =
        await this.diplomaCoursesRepo.findAll(
          {
            diplomaId: diploma.id,
            courseId: { [Op.ne]: courseId },
            keptForOldAssignments: false
          },
          [{ model: Course }]
        );

      console.log(
        'diplomaCoursesWithoutTheUpdatedCourse :',
        diplomaCoursesWithoutTheUpdatedCourse.map(dc => dc.course.enTitle)
      );
      console.log('-----------------------------------------------');

      //3. the new total price of the diploma courses
      const newTotalPrice =
        newCoursePrice +
        diplomaCoursesWithoutTheUpdatedCourse
          .map(dc => dc.course.priceAfterDiscount ?? dc.course.originalPrice)
          .reduce((a, b) => a + b, 0);

      console.log('newTotalPrice :', newTotalPrice);
      console.log('-----------------------------------------------');

      //4. get the diploma price
      const diplomaPrice = diploma.priceAfterDiscount ?? diploma.originalPrice;
      console.log('diplomaPrice :', diplomaPrice);
      console.log('-----------------------------------------------');

      //5. validate if the new total price is less than the diploma price
      if (diplomaPrice > newTotalPrice) {
        console.log(
          'error in the new price because of diplomas 🐔🐔🐔🐔🐔🐔🐔🐔'
        );
        throw new BaseHttpException(
          ErrorCodeEnum.INVALID_COURSE_PRICE_FOR_DIPLOMA
        );
      }
    }
    return true;
  }

  private validateLecturerCommissions(
    coursePrice: number,
    lecturersInput: CourseLecturerInput[],
    vatPercentage: number,
    gatewayVatPercentage: number
  ) {
    // unique lecturers validation
    const lecturerIds = lecturersInput.map(l => l.userIdOfLecturer);

    const uniqueLecturerIds = new Set(lecturerIds);

    if (uniqueLecturerIds.size !== lecturerIds.length) {
      throw new BaseHttpException(ErrorCodeEnum.DUPLICATED_LECTURER_IN_COURSE);
    }

    // commissions validation
    const vatAmount = (vatPercentage / 100) * coursePrice;
    const gatewayVatAmount = (gatewayVatPercentage / 100) * coursePrice;

    const availableAmount = coursePrice - vatAmount - gatewayVatAmount;

    console.log('gatewayVatAmount : ', gatewayVatAmount);
    console.log('vatAmount : ', vatAmount);
    console.log('availableAmount : ', availableAmount);

    const totalCommissionPercentage = lecturersInput.reduce(
      (sum, l) => sum + l.commission,
      0
    );

    console.log('totalCommissionPercentage : ', totalCommissionPercentage);

    if (totalCommissionPercentage > 100) {
      throw new BaseHttpException(
        ErrorCodeEnum.LECTURERS_COMMISSIONS_EXCEED_100_PERCENT
      );
    }

    const totalCommissionAmount =
      (totalCommissionPercentage / 100) * coursePrice;

    console.log('totalCommissionAmount : ', totalCommissionAmount);

    if (totalCommissionAmount > availableAmount) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_LECTURERS_COMMISSIONS);
    }

    return true;
  }

  async getMaxLecturersCommissionPercentage(): Promise<number> {
    const { vatPercentage, paymentGatewayVatPercentage } =
      await this.getVatValues();

    const totalVatPercentage = vatPercentage + paymentGatewayVatPercentage;

    return +(100 - totalVatPercentage).toFixed(2);
  }

  async uniqueById<T extends { id: string | number }>(array: T[]) {
    const seen = new Set<string | number>();
    return array.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  async latestLearningPrograms<T>(
    type: LearningProgramTypeEnum,
    categoryId?: number,
    isLiveCourse?: boolean,
    diplomaType?: DiplomaTypeEnum
  ): Promise<T[]> {
    // COURSES & WORKSHOPS
    if (
      type === LearningProgramTypeEnum.COURSE ||
      type === LearningProgramTypeEnum.WORKSHOP
    ) {
      const where: any = {
        type:
          type === LearningProgramTypeEnum.COURSE ?
            CourseTypeEnum.COURSE
          : CourseTypeEnum.WORKSHOP,
        status: CourseStatusEnum.APPROVED,
        publicationStatus: PublicationStatusEnum.PUBLIC,
        ...(categoryId && { categoryId }),
        ...(isLiveCourse !== undefined && { isLiveCourse })
      };

      const result = await this.courseRepo.findAll(
        where,
        [
          {
            model: CourseLecturer,
            required: true,
            include: [{ model: Lecturer }]
          }
        ],
        [['createdAt', 'DESC']],
        undefined,
        undefined,
        undefined,
        true
      );

      return (await this.uniqueById(result)).slice(0, 4) as T[];
    }

    // DIPLOMAS
    const where: any = {
      status: DiplomaStatusEnum.APPROVED,
      publicationStatus: PublicationStatusEnum.PUBLIC,
      ...(categoryId && { categoryId }),
      ...(diplomaType && { diplomaType })
    };

    const result = await this.diplomaRepo.findAll(
      where,
      [],
      [['createdAt', 'DESC']],
      undefined,
      undefined,
      undefined,
      true
    );

    return (await this.uniqueById(result)).slice(0, 4) as T[];
  }

  async getLearningProgramsByCategoryId(
    categoryId: number
  ): Promise<LearningProgramsForCategory> {
    const [
      courses,
      liveCourses,
      workshops,
      pathDiplomas,
      subscriptionDiplomas
    ] = await Promise.all([
      this.latestLearningPrograms<Course>(
        LearningProgramTypeEnum.COURSE,
        categoryId,
        false
      ),
      this.latestLearningPrograms<Course>(
        LearningProgramTypeEnum.COURSE,
        categoryId,
        true
      ),
      this.latestLearningPrograms<Course>(
        LearningProgramTypeEnum.WORKSHOP,
        categoryId,
        false
      ),
      this.latestLearningPrograms<Diploma>(
        LearningProgramTypeEnum.DIPLOMA,
        categoryId,
        undefined,
        DiplomaTypeEnum.PATH
      ),
      this.latestLearningPrograms<Diploma>(
        LearningProgramTypeEnum.DIPLOMA,
        categoryId,
        undefined,
        DiplomaTypeEnum.SUBSCRIPTION
      )
    ]);

    return {
      Courses: courses,
      liveCourses,
      Workshops: workshops,
      pathDiplomas,
      subscriptionDiplomas
    };
  }

  private validateCourseSections(
    status: CourseStatusEnum,
    sections?: { lessons?: any[]; lessonsInput?: any[] }[]
  ): void {
    if (!sections?.length) return;

    const hasEmptySection = sections.some(sec => {
      const lessons = sec.lessons ?? sec.lessonsInput;
      return !lessons || lessons.length === 0;
    });

    // Only enforce validation once course leaves draft state
    if (status !== CourseStatusEnum.DRAFTED && hasEmptySection) {
      throw new BaseHttpException(ErrorCodeEnum.SECTION_MUST_HAVE_LESSONS);
    }
  }

  async validateCourseLessonsInputs(
    input: CreateDraftedCourseByLecturerInput
  ): Promise<void> {
    if (input?.sectionsInput?.length > 0) {
      for (const section of input.sectionsInput) {
        if (section?.lessonsInput?.length > 0) {
          for (const lesson of section.lessonsInput) {
            // 1. Validate Live Session
            if (lesson?.type === LessonTypeEnum.LIVE_SESSION) {
              await this.sectionService.validateLessonDates(
                lesson.liveSessionStartAt,
                lesson.liveSessionEndAt,
                input?.status
              );
            }

            // 2. Validate Quiz
            if (lesson?.type === LessonTypeEnum.QUIZ) {
              const { questions } = lesson;
              const isDraftOrPreview =
                input?.status === CourseStatusEnum.DRAFTED ||
                input?.status === CourseStatusEnum.PREVIEWED;

              if (isDraftOrPreview) {
                // In draft/preview mode: validation is optional, but if data exists it must be valid
                if (questions && questions.length > 0) {
                  for (const q of questions) {
                    if (q.answers && q.answers.length > 0) {
                      const correctAnswers = q.answers.filter(a => a.isCorrect);

                      if (!q.isMultipleAnswers && correctAnswers.length > 1) {
                        throw new BaseHttpException(
                          ErrorCodeEnum.ONLY_ONE_CORRECT_ANSWER_ALLOWED
                        );
                      }
                    }

                    if (q.order != null && q.order < 1) {
                      throw new BaseHttpException(
                        ErrorCodeEnum.QUESTION_ORDER_INVALID
                      );
                    }
                  }
                }
              } else {
                // In published/active mode: validation is required
                if (!questions || questions.length === 0) {
                  throw new BaseHttpException(
                    ErrorCodeEnum.QUIZ_MUST_HAVE_QUESTIONS
                  );
                }

                for (const q of questions) {
                  if (!q.answers || q.answers.length === 0) {
                    throw new BaseHttpException(
                      ErrorCodeEnum.QUESTION_MUST_HAVE_ANSWERS
                    );
                  }

                  const correctAnswers = q.answers.filter(a => a.isCorrect);
                  if (correctAnswers.length === 0) {
                    throw new BaseHttpException(
                      ErrorCodeEnum.QUESTION_MUST_HAVE_CORRECT_ANSWER
                    );
                  }

                  if (!q.isMultipleAnswers && correctAnswers.length > 1) {
                    throw new BaseHttpException(
                      ErrorCodeEnum.ONLY_ONE_CORRECT_ANSWER_ALLOWED
                    );
                  }

                  if (q.isMultipleAnswers && correctAnswers.length < 2) {
                    throw new BaseHttpException(
                      ErrorCodeEnum.MULTIPLE_ANSWERS_REQUIRE_AT_LEAST_TWO_CORRECT
                    );
                  }

                  if (q.order == null || q.order < 1) {
                    throw new BaseHttpException(
                      ErrorCodeEnum.QUESTION_ORDER_INVALID
                    );
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  async validateCourseLessonsInputsForUpdate(
    input: UpdateCourseByAdminInput
  ): Promise<void> {
    if (input.sections?.length > 0) {
      for (const section of input.sections) {
        if (section?.lessons?.length > 0) {
          for (const lesson of section.lessons) {
            const isDraftOrPreview =
              input.status === CourseStatusEnum.DRAFTED ||
              input.status === CourseStatusEnum.PREVIEWED;

            // 1. Live Session
            if (lesson?.type === LessonTypeEnum.LIVE_SESSION) {
              if (
                !isDraftOrPreview &&
                (!lesson?.videoUrl ||
                  !lesson?.liveSessionStartAt ||
                  !lesson?.liveSessionEndAt)
              ) {
                throw new BaseHttpException(ErrorCodeEnum.INVALID_LESSON_INPUT);
              }

              if (!lesson?.lessonId) {
                await this.sectionService.validateLessonDates(
                  lesson?.liveSessionStartAt,
                  lesson?.liveSessionEndAt,
                  input.status
                );
              }
            }

            // 2. Article
            else if (lesson?.type === LessonTypeEnum.ARTICLE) {
              if (!isDraftOrPreview && !lesson?.content) {
                throw new BaseHttpException(ErrorCodeEnum.INVALID_LESSON_INPUT);
              }
            }

            // 3. Video
            else if (lesson?.type === LessonTypeEnum.VIDEO) {
              if (!isDraftOrPreview && !lesson?.videoId) {
                throw new BaseHttpException(ErrorCodeEnum.INVALID_LESSON_INPUT);
              }
            }

            // 4. Quiz
            else if (lesson?.type === LessonTypeEnum.QUIZ) {
              const { questions } = lesson;

              if (isDraftOrPreview) {
                // optional validation
                if (questions && questions.length > 0) {
                  for (const q of questions) {
                    if (q.answers && q.answers.length > 0) {
                      const correctAnswers = q.answers.filter(a => a.isCorrect);
                      if (!q.isMultipleAnswers && correctAnswers.length > 1) {
                        throw new BaseHttpException(
                          ErrorCodeEnum.ONLY_ONE_CORRECT_ANSWER_ALLOWED
                        );
                      }
                    }

                    if (q.order != null && q.order < 1) {
                      throw new BaseHttpException(
                        ErrorCodeEnum.QUESTION_ORDER_INVALID
                      );
                    }
                  }
                }
              } else {
                // required validation
                if (!questions || questions.length === 0) {
                  throw new BaseHttpException(
                    ErrorCodeEnum.QUIZ_MUST_HAVE_QUESTIONS
                  );
                }

                for (const q of questions) {
                  if (!q.answers || q.answers.length === 0) {
                    throw new BaseHttpException(
                      ErrorCodeEnum.QUESTION_MUST_HAVE_ANSWERS
                    );
                  }

                  const correctAnswers = q.answers.filter(a => a.isCorrect);
                  if (correctAnswers.length === 0) {
                    throw new BaseHttpException(
                      ErrorCodeEnum.QUESTION_MUST_HAVE_CORRECT_ANSWER
                    );
                  }

                  if (!q.isMultipleAnswers && correctAnswers.length > 1) {
                    throw new BaseHttpException(
                      ErrorCodeEnum.ONLY_ONE_CORRECT_ANSWER_ALLOWED
                    );
                  }

                  if (q.isMultipleAnswers && correctAnswers.length < 2) {
                    throw new BaseHttpException(
                      ErrorCodeEnum.MULTIPLE_ANSWERS_REQUIRE_AT_LEAST_TWO_CORRECT
                    );
                  }

                  if (q.order == null || q.order < 1) {
                    throw new BaseHttpException(
                      ErrorCodeEnum.QUESTION_ORDER_INVALID
                    );
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  async createMissingSlugs(): Promise<boolean> {
    // const courses = await this.courseRepo.findAll({ slug: null });
    // const lecturers = await this.userRepo.findAll({
    //   role: UserRoleEnum.LECTURER,
    //   slug: null
    // });
    // const diplomas = await this.diplomaRepo.findAll({ slug: null });
    // const blogs = await this.blogRepo.findAll({ slug: null });

    // const modelsToUpdate = [...courses, ...lecturers, ...diplomas, ...blogs];

    // const courseCategories = await this.categoryRepo.findAll({
    //   slug: null
    // });
    // const blogCategories = await this.blogCategoryRepo.findAll({
    //   slug: null
    // })

    const blogTags = await this.TagsRepo.findAll({ slug: null });
    const modelsToUpdate = [...blogTags];

    for (const model of modelsToUpdate) {
      await model.save();
    }

    return true;
  }

  // if the course is private, check if the user can access
  async checkCourseAccess(course: Course, user: User): Promise<Course> {
    if (course.publicationStatus === PublicationStatusEnum.PRIVATE) {
      if (!user) {
        throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);
      }

      if (
        user.role === UserRoleEnum.ADMIN ||
        user.role === UserRoleEnum.LECTURER
      ) {
        return course;
      }

      const isAssigned = await this.usersAssignmentsRepo.findOne({
        courseId: course.id,
        userId: user.id
      });

      if (!isAssigned) {
        throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);
      }
    }

    return course;
  }
  async cleanupUserCourseData(
    userId: string,
    courseIds: string[],
    transaction?: Transaction
  ): Promise<void> {
    if (!courseIds.length) return;

    // 1. Fetch all lessons that belong to the given courses
    const lessons = await this.lessonRepo.findAll(
      {},
      [
        {
          model: Section,
          where: { courseId: { [Op.in]: courseIds } },
          attributes: []
        }
      ],
      null,
      ['id'],
      null,
      transaction
    );

    const lessonIds = lessons.map(lesson => lesson.id);

    // If the courses have no lessons, nothing to clean up
    if (!lessonIds.length) return;

    // 2. Fetch all quiz attempts made by the user in these lessons
    const attempts = await this.userQuizAttemptRepo.findAll(
      {
        userId,
        lessonId: { [Op.in]: lessonIds }
      },
      null,
      null,
      ['id'],
      null,
      transaction
    );

    const attemptIds = attempts.map(attempt => attempt.id);

    // If there are no attempts, only clean up lesson progress
    if (!attemptIds.length) {
      await this.userLessonProgressRepo.deleteAll(
        {
          userId,
          lessonId: { [Op.in]: lessonIds }
        },
        transaction
      );
      return;
    }

    // 3. Fetch all user answers related to the collected attempts
    const userAnswers = await this.userAnswerRepo.findAll(
      {
        attemptId: { [Op.in]: attemptIds }
      },
      null,
      null,
      ['id'],
      null,
      transaction
    );

    const userAnswerIds = userAnswers.map(answer => answer.id);

    // 4. Delete relations between user answers and quiz answers
    if (userAnswerIds.length) {
      await this.userAnswerQuizAnswerRepo.deleteAll(
        {
          userAnswerId: { [Op.in]: userAnswerIds }
        },
        transaction
      );
    }

    // 5. Delete all user answers
    await this.userAnswerRepo.deleteAll(
      {
        attemptId: { [Op.in]: attemptIds }
      },
      transaction
    );

    // 6. Delete all quiz attempts
    await this.userQuizAttemptRepo.deleteAll(
      {
        id: { [Op.in]: attemptIds }
      },
      transaction
    );

    // 7. Delete user lesson progress records
    await this.userLessonProgressRepo.deleteAll(
      {
        userId,
        lessonId: { [Op.in]: lessonIds }
      },
      transaction
    );
  }

  private async shouldCleanupCourseData(
    userId: string,
    courseId: string,
    excludedDiplomaId?: string
  ): Promise<boolean> {
    const assignments = await this.usersAssignmentsRepo.findAll({
      userId,
      courseId
    });

    if (assignments.length === 0) return true;

    if (
      excludedDiplomaId &&
      assignments.every(a => a.diplomaId === excludedDiplomaId)
    ) {
      return true;
    }

    return false;
  }

  calculateAccessExpirationDate(accessDurationPerMonths?: number): Date | null {
    if (!accessDurationPerMonths || accessDurationPerMonths <= 0) {
      return null;
    }

    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'production';

    const now = new Date();
    const expiresAt = new Date(now);

    if (nodeEnv === 'production') {
      // Production: treat as months
      expiresAt.setMonth(expiresAt.getMonth() + accessDurationPerMonths);
    } else {
      // Development / Staging: treat as minutes for testing
      expiresAt.setMinutes(expiresAt.getMinutes() + accessDurationPerMonths);
    }

    return expiresAt;
  }

  async generateUniqueSlug(course: Course, enTitle: string): Promise<string> {
    if (!enTitle) return '';

    const baseSlug = slugify(enTitle, { lowercase: true });
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (
      await this.courseRepo.findOne({
        slug: uniqueSlug,
        id: { [Op.ne]: course.id } // ignore current course
      })
    ) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    return uniqueSlug;
  }

  async getUserDiplomasForCourseAndRegisterViews({
    userId,
    courseId
  }): Promise<void> {
    // Fetch diplomaIds assigned to user for this course
    const diplomaIds: string[] = (
      await this.usersAssignmentsRepo.findAll({
        userId,
        courseId,
        diplomaId: { [Op.ne]: null }
      })
    ).map(assignment => assignment.diplomaId);

    if (diplomaIds.length === 0) {
      return;
    }

    // Remove duplicates
    const uniqueDiplomaIds = [...new Set(diplomaIds)];

    // Register view per diploma (ignore duplicates)
    for (const diplomaId of uniqueDiplomaIds) {
      try {
        await this.userCourseDiplomaViewRepo.createOne({
          userId,
          courseId,
          diplomaId
        });
      } catch {
        console.log('Duplicate view .........');
        // Duplicate view -> safely ignored
      }
    }
  }
}
