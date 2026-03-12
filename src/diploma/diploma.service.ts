import { Inject, Injectable } from '@nestjs/common';
import { BunnyService } from '@src/_common/bunny/bunny-service';
import { UploadedVideoLibrary } from '@src/_common/bunny/bunny.type';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { MailService } from '@src/_common/mail/mail.service';
import { IMailService } from '@src/_common/mail/mail.type';
import {
  NullablePaginatorInput,
  PaginatorInput
} from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { UploaderService } from '@src/_common/uploader/uploader.service';
import { HelperService } from '@src/_common/utils/helper.service';
import { CodePrefix } from '@src/_common/utils/helpers.enum';
import {
  LearningProgramTypeEnum,
  UpperCaseLearningProgramTypeEnum
} from '@src/cart/enums/cart.enums';
import { CartItem } from '@src/cart/models/cart-item.model';
import { Category } from '@src/course-specs/category/category.model';
import { CategoryService } from '@src/course-specs/category/category.service';
import { Skill } from '@src/course-specs/skill/models/skill.model';
import { SkillService } from '@src/course-specs/skill/skill.service';
import { Tool } from '@src/course-specs/tool/models/tool.model';
import { ToolService } from '@src/course-specs/tool/tool.service';
import {
  CourseTypeEnum,
  PublicationStatusEnum
} from '@src/course/enums/course.enum';
import { CourseUserFilterEnum } from '@src/course/inputs/course-user-filter.input';
import { UserCourseProgress } from '@src/course/interfaces/course.type';
import { Collection } from '@src/course/models/collection.model';
import { Course } from '@src/course/models/course.model';
import { Lesson } from '@src/course/models/lesson.model';
import { Section } from '@src/course/models/section.model';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { CourseService } from '@src/course/services/course.service';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { Review } from '@src/reviews/review.model';
import { User } from '@src/user/models/user.model';
import { UserService } from '@src/user/services/user.service';
import { UserRoleEnum } from '@src/user/user.enum';
import { Ulid } from 'id128';
import { Op, QueryTypes, Sequelize, Transaction } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import {
  DiplomaSortEnum,
  DiplomaStatusEnum,
  UsersSortEnum
} from './enums/diploma-status.enum';
import { AssignUsersToDiplomaInput } from './inputs/assign-user-to-diploma.input';
import {
  CreateDiplomaInput,
  CreateDraftedDiplomaInput,
  IDiplomaLearningPrograms,
  PublishDraftedDiplomaInput
} from './inputs/create-diploma.input';
import { DiplomaProgramsInput } from './inputs/diploma-programs.input';
import {
  DiplomaProgramsBoardFilterInput,
  DiplomaProgramsSortInput,
  DiplomasBoardSortInput,
  DiplomasSiteFilterInput,
  DiplomaUsersBoardSortInput,
  FilterDiplomaInput,
  FilterDiplomaUsersInput
} from './inputs/filter-diploma.input';
import { lecturerDiplomasFilter } from './inputs/lecturer-diplomas-board.input';
import { UpdateDiplomaInput } from './inputs/update-diploma.input';
import { DiplomaCourses } from './models/diploma-course.model';
import { DiplomaDetail } from './models/diploma-detail.model';
import { Diploma } from './models/diploma.model';
import { Logs } from './models/logs.model';
import { EmailToUsersTypeEnum } from './types/calculate-prices-under-diloma';
import { Templates } from '@src/_common/mail/templates-types';
import { userProgressByPrograms } from './outputs/users-progress.response';
import { coursesAndWorkshopsCountOutput } from './types/calculate-prices-under-diloma';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProgramsPublicationStatusEnum } from './enums/programs-publication-status.enum';
import { NotificationService } from '@src/notification/notification.service';
import {
  NotificationParentTypeEnum,
  NotificationTypeEnum,
  SiteNotificationsTypeEnum
} from '@src/notification/notification.enum';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RevenueShareService } from '@src/payment/services/revenue.service';
import { Notification } from '@src/notification/models/notification.model';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { Cart } from '@src/cart/models/cart.model';
import { CartService } from '@src/cart/services/cart.service';
import { CourseDetail } from '@src/course/models/course-detail.model';
import { ContentReport } from '@src/report/models/report.model';
import { DiplomaTypeEnum } from './enums/diploma-type.enum';
import { slugify } from 'transliteration';
import { UserCourseDiplomaView } from './models/user-course-diploma-view.model';
import {
  DiplomaAnalytics,
  DiplomaAnalyticsCourse
} from './types/diploma-analytics.type';
import { GqlDiplomaCourseAnalyticsPaginatedResponse } from './outputs/diploma-courses-analytics.response';
import {
  CLEANUP_DIPLOMA_JOB,
  DIPLOMA_DELETION_QUEUE
} from './processors/delete-diploma.processor';

@Injectable()
export class DiplomaService {
  constructor(
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    //repos
    @Inject(Repositories.CoursesRepository)
    private readonly coursesRepo: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomaRepo: IRepository<Diploma>,
    @Inject(Repositories.CollectionsRepository)
    private readonly collectionRepo: IRepository<Collection>,
    @Inject(Repositories.DiplomaDetailsRepository)
    private readonly diplomaDetailsRepo: IRepository<DiplomaDetail>,
    @Inject(Repositories.DiplomaCoursesRepository)
    private readonly diplomaCoursesRepo: IRepository<DiplomaCourses>,
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly userAssignmentsRepo: IRepository<UsersAssignment>,
    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>,
    @Inject(Repositories.LogsRepository)
    private readonly logsRepo: IRepository<Logs>,
    @Inject(Repositories.ReviewsRepository)
    private readonly reviewsRepo: IRepository<Review>,
    @Inject(Repositories.CartItemsRepository)
    private readonly cartItemRepo: IRepository<CartItem>,
    @Inject(Repositories.NotificationsRepository)
    private readonly notificationsRepo: IRepository<Notification>,
    @Inject(Repositories.CourseLecturersRepository)
    private readonly courseLecturersRepo: IRepository<CourseLecturer>,
    @Inject(Repositories.CartsRepository)
    private readonly cartRepo: IRepository<Cart>,
    @Inject(Repositories.CourseDetailsRepository)
    private readonly courseDetailsRepo: IRepository<CourseDetail>,
    @Inject(Repositories.ContentReportsRepository)
    private readonly reportRepo: IRepository<ContentReport>,
    //services
    private readonly toolService: ToolService,
    private readonly skillService: SkillService,
    private readonly bunnyService: BunnyService,
    private readonly courseService: CourseService,
    private readonly userService: UserService,
    private readonly helperService: HelperService,
    private readonly categoryService: CategoryService,
    private readonly uploaderService: UploaderService,
    private readonly siteNotificationService: NotificationService,
    private readonly revenueService: RevenueShareService,
    private readonly cartService: CartService,
    @Inject(MailService) private readonly mailService: IMailService,
    private eventEmitter: EventEmitter2,
    @InjectQueue('pusher') private readonly pusherQueue: Queue,
    @InjectQueue('PricingCalcs')
    private readonly pricingCalcsQueue: Queue,
    @InjectQueue(DIPLOMA_DELETION_QUEUE)
    private readonly diplomaDeletionQueue: Queue
  ) {}
  async findDiplomaOrError(diplomaId: string): Promise<Diploma> {
    const diploma = await this.diplomaRepo.findOne({ id: diplomaId }, [
      {
        model: DiplomaDetail
      }
    ]);
    if (!diploma)
      throw new BaseHttpException(ErrorCodeEnum.DIPLOMA_DOESNT_EXIST);
    return diploma;
  }
  async createDraftedDiploma(
    input?: CreateDraftedDiplomaInput
  ): Promise<Diploma> {
    if (!this.helperService.validateObjectAtLeastOneKey(input))
      throw new BaseHttpException(
        ErrorCodeEnum.DRAFTED_PROGRAM_MUST_INCLUDE_ONE_INPUT
      );
    return await this.createDiploma(input, false, false);
  }
  async createPublishedDiploma(input?: CreateDiplomaInput): Promise<Diploma> {
    if (input.learningPrograms.length === 0)
      throw new BaseHttpException(ErrorCodeEnum.SYLLABUS_SHOULD_NOT_BE_EMPTY);
    if (!input.language)
      throw new BaseHttpException(ErrorCodeEnum.PLEASE_SELECT_DIPLOMA_LANG);
    const newDiploma = await this.createDiploma(
      {
        ...input,
        status: DiplomaStatusEnum.APPROVED
      },
      true
    );

    // send emails and notifications to all the app users that there is a new learning program
    if (newDiploma.publicationStatus === PublicationStatusEnum.PUBLIC) {
      const diplomaDetails = await this.diplomaDetailsRepo.findOne({
        diplomaId: newDiploma.id
      });
      try {
        void this.sendEmailsAndSiteNotificationsToUsers(
          newDiploma,
          EmailToUsersTypeEnum.NEW_PROGRAM_AVAILABLE,
          null,
          diplomaDetails.promoVideo
        );
        // send emails and notifications to learningPrograms lecturers that thier learning program is added to diploma
        void this.sendEmailsAndSiteNotificationsToLecturers(
          newDiploma,
          input.learningPrograms
        );
      } catch (e) {
        console.log(e);
      }
    }

    return newDiploma;
  }

  async programsPublicationStatus(
    learningPrograms: IDiplomaLearningPrograms[]
  ): Promise<ProgramsPublicationStatusEnum> {
    const programsIds = learningPrograms.map(e => e.courseId);
    const publicationStatuses = (
      await this.coursesRepo.findAll({
        id: programsIds
      })
    ).map(e => e.publicationStatus);

    if (publicationStatuses.every(e => e === PublicationStatusEnum.PRIVATE)) {
      return ProgramsPublicationStatusEnum.ALL_PRIVATE;
    } else if (
      publicationStatuses.some(e => e === PublicationStatusEnum.PRIVATE)
    ) {
      return ProgramsPublicationStatusEnum.SOME_PRIVATE;
    }
    return ProgramsPublicationStatusEnum.ALL_PUBLIC;
  }

  async setProgramsPublicationStatusToPublic(ids: string[]): Promise<boolean> {
    const programs = await this.coursesRepo.findAll({ id: ids });
    if (programs.length !== ids.length) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
    }
    return await this.sequelize.transaction(async transaction => {
      try {
        for (const program of programs) {
          await this.coursesRepo.updateOne(
            { id: program.id },
            { publicationStatus: PublicationStatusEnum.PUBLIC },
            transaction
          );
        }
        return true;
      } catch (error) {
        throw new BaseHttpException(ErrorCodeEnum.DATABASE_ERROR);
      }
    });
  }

  async createDiploma(
    input?: CreateDraftedDiplomaInput,
    checkPuplicationStatus: boolean = false,
    addToPusher: boolean = true
  ): Promise<Diploma> {
    let coursesCount = 0,
      workshopsCount = 0,
      lecturersIds: string[] = [];

    const courses = await this.coursesRepo.findAll(
      {
        id: input.learningPrograms.map(e => e.courseId)
      },
      [
        {
          model: CourseLecturer
        }
      ]
    );

    courses.forEach(course => {
      if (course.type === CourseTypeEnum.COURSE) coursesCount++;
      if (course.type === CourseTypeEnum.WORKSHOP) workshopsCount++;

      course.courseLecturers.forEach((courseLecturer: CourseLecturer) => {
        const lecturerId = courseLecturer.lecturerId;
        if (!lecturersIds.includes(lecturerId)) {
          lecturersIds.push(lecturerId);
        }
      });
    });

    const lecturersCount = lecturersIds.length;

    const {
      categoryId,
      learningPrograms,
      originalPrice,
      priceAfterDiscount,
      collectionId,
      accessDurationPerMonths,
      diplomaType,
      status
    } = input;

    this.validateAccessDuration(diplomaType, accessDurationPerMonths, status);

    if (checkPuplicationStatus) {
      if (input.publicationStatus === PublicationStatusEnum.PUBLIC) {
        const status = await this.programsPublicationStatus(learningPrograms);
        if (status === ProgramsPublicationStatusEnum.ALL_PRIVATE) {
          throw new BaseHttpException(ErrorCodeEnum.ALL_PROGRAMS_PRIVATE);
        }
        if (status === ProgramsPublicationStatusEnum.SOME_PRIVATE) {
          throw new BaseHttpException(ErrorCodeEnum.SOME_PROGRAMS_PRIVATE);
        }
      }
    }

    if (categoryId)
      await this.categoryService.activeCategoryOrError(input.categoryId);

    let collection: Collection;
    if (collectionId) {
      collection = await this.collectionRepo.findOne({
        id: collectionId
      });
      if (!collection) {
        throw new BaseHttpException(ErrorCodeEnum.COLLECTION_NOT_EXISTS);
      }
    }

    this.validateDiplomaPrice(originalPrice, priceAfterDiscount);
    const diplomaIsNotFree = priceAfterDiscount > 0 || originalPrice > 0;
    if (diplomaIsNotFree) {
      const validPrices =
        await this.validatePricesOfLearningProgramsUnderDiploma(
          learningPrograms,
          priceAfterDiscount >= 0 && priceAfterDiscount !== null ?
            priceAfterDiscount
          : originalPrice,
          originalPrice
        );

      if (!validPrices) {
        throw new BaseHttpException(ErrorCodeEnum.WRONG_CALCS);
      }
    } else {
      for (const learningProgram of learningPrograms) {
        if (learningProgram.PriceUnderDiploma > 0) {
          throw new BaseHttpException(ErrorCodeEnum.WRONG_CALCS);
        }
      }
    }

    const createdDiploma = await this.sequelize.transaction(
      async transaction => {
        const diploma = await this.diplomaRepo.createOne(
          {
            ...input,
            id: Ulid.generate().toRaw(),
            priceAfterDiscount: priceAfterDiscount,
            code: await this.helperService.generateModelCodeWithPrefix(
              CodePrefix.DIPLOMA,
              this.diplomaRepo
            )
          },
          transaction
        );

        if (learningPrograms?.length) {
          await this.setDiplomaLearningPrograms(
            diploma.id,
            learningPrograms,
            !diplomaIsNotFree,
            transaction
          );
        }

        await this.setDiplomaUploadedFilesReferences(diploma, transaction);
        await this.toolService.setTools(diploma, input?.toolsIds, transaction);
        await this.skillService.setSkills(
          diploma,
          input?.skillsIds,
          transaction
        );

        const diplomaDetail = await this.diplomaDetailsRepo.createOne(
          {
            ...input,
            diplomaId: diploma.id,
            coursesCount: coursesCount || 0,
            workshopsCount: workshopsCount || 0,
            lecturersCount: lecturersCount || 0
          },
          transaction
        );

        await this.setDiplomaDetailsUploadedFilesReferences(
          diplomaDetail,
          transaction
        );

        diploma.collectionId &&
          (await this.bunnyService.updateCollectionName(
            diploma.collectionId,
            diploma.enTitle,
            // UploadedVideoLibrary.DIPLOMA
            UploadedVideoLibrary.COURSE
          ));

        if (collection)
          await this.collectionRepo.updateOneFromExistingModel(
            collection,
            {
              hasReference: true,
              ...(diploma.enTitle && { name: diploma.enTitle })
            },
            transaction
          );

        return diploma;
      }
    );

    return createdDiploma;
  }

  async publishDraftedDiploma(
    input?: PublishDraftedDiplomaInput
  ): Promise<Diploma> {
    const {
      learningPrograms,
      originalPrice,
      priceAfterDiscount,
      toolsIds,
      skillsIds,
      categoryId
    } = input;
    const diploma = await this.diplomaRepo.findOne({ id: input.diplomaId }, [
      DiplomaDetail,
      Skill,
      Tool,
      Course
    ]);

    if (!learningPrograms || learningPrograms.length === 0) {
      throw new BaseHttpException(ErrorCodeEnum.SYLLABUS_SHOULD_NOT_BE_EMPTY);
    }

    if (!categoryId) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    if (!diploma || diploma.status !== DiplomaStatusEnum.DRAFTED)
      throw new BaseHttpException(ErrorCodeEnum.THERE_IS_NO_DRAFTED_DIPLOMA);

    this.validateDiplomaPrice(originalPrice, priceAfterDiscount);

    this.validateAccessDuration(
      input.diplomaType,
      input.accessDurationPerMonths,
      DiplomaStatusEnum.APPROVED
    );

    if (priceAfterDiscount > 0) {
      const validPrices =
        await this.validatePricesOfLearningProgramsUnderDiploma(
          learningPrograms,
          priceAfterDiscount >= 0 && priceAfterDiscount !== null ?
            priceAfterDiscount
          : originalPrice,
          originalPrice
        );
      if (!validPrices) {
        throw new BaseHttpException(ErrorCodeEnum.WRONG_CALCS);
      }
    }

    await this.sequelize.transaction(async transaction => {
      // Generate unique slug before updating
      const slug = await this.generateUniqueSlug(diploma, input.enTitle);

      await this.diplomaRepo.updateOneFromExistingModel(diploma, {
        ...input,
        slug,
        status: DiplomaStatusEnum.APPROVED
      });

      await this.diplomaDetailsRepo.updateOneFromExistingModel(
        diploma.diplomaDetail,
        {
          ...input,
          publishedAt: new Date()
        }
      );

      if (
        toolsIds?.length !== diploma?.tools?.length ||
        !diploma.tools.every(tool => toolsIds.includes(tool.id))
      ) {
        await this.toolService.setTools(diploma, toolsIds, transaction);
      }

      if (
        skillsIds?.length !== diploma?.skills?.length ||
        !diploma.skills.every(tool => input.skillsIds.includes(tool.id))
      ) {
        await this.skillService.setSkills(diploma, skillsIds, transaction);
      }

      await this.setDiplomaUploadedFilesReferences(diploma, transaction);

      await this.setDiplomaLearningPrograms(
        diploma.id,
        input.learningPrograms,
        priceAfterDiscount > 0,
        transaction
      );
    });

    // send emails and notifications to all the app users that there is a new learning program
    if (diploma.publicationStatus === PublicationStatusEnum.PUBLIC) {
      const diplomaDetails = await this.diplomaDetailsRepo.findOne({
        diplomaId: diploma.id
      });
      try {
        void this.sendEmailsAndSiteNotificationsToUsers(
          diploma,
          EmailToUsersTypeEnum.NEW_PROGRAM_AVAILABLE,
          null,
          diplomaDetails.promoVideo
        );
        // send emails and notifications to learningPrograms lecturers that thier learning program is added to diploma
        void this.sendEmailsAndSiteNotificationsToLecturers(diploma, [
          ...diploma.courses.map(lp => ({ courseId: lp.id }))
        ]);
      } catch (e) {
        console.log('hiiiiiiiiiiiiii');
        console.log(e);
      }
    }
    return diploma;
  }
  async createDiplomaPreview(
    input: CreateDraftedDiplomaInput
  ): Promise<Diploma> {
    if (!this.helperService.validateObjectAtLeastOneKey(input))
      throw new BaseHttpException(
        ErrorCodeEnum.DRAFTED_PROGRAM_MUST_INCLUDE_ONE_INPUT
      );
    await this.diplomaRepo.deleteAll({
      status: DiplomaStatusEnum.PREVIEWED
    });
    return await this.createDiploma({
      ...input,
      status: DiplomaStatusEnum.PREVIEWED
    });
  }
  async validatePricesOfLearningProgramsUnderDiploma(
    learnigPrograms: IDiplomaLearningPrograms[],
    diplomaPrice: number,
    originalPrice?: number
  ): Promise<boolean> {
    console.log('VALIDATING PRICES.....');
    const progarmsIds = learnigPrograms?.map(program => program.courseId);
    const progarms = await this.coursesRepo.findAll({ id: progarmsIds });
    console.log(
      'prices of progarms',
      progarms.map(program => {
        return {
          id: program.id,
          title: program.enTitle,
          priceAfterDiscount: program.priceAfterDiscount
        };
      })
    );

    //get the sum of prices of programs outside the diploma
    const sumOfPrices = progarms.reduce((total, course) => {
      const { priceAfterDiscount, originalPrice } = course;
      const price = priceAfterDiscount ? priceAfterDiscount : originalPrice;

      total = total + price;
      return total;
    }, 0);

    if (!sumOfPrices) {
      throw new BaseHttpException(
        ErrorCodeEnum.AT_LEAST_ONE_PROGRAM_MUST_HAVE_PRICE
      );
    }
    console.log('sumOfPrices', sumOfPrices, diplomaPrice, originalPrice);

    if (sumOfPrices < diplomaPrice || sumOfPrices < originalPrice) {
      throw new BaseHttpException(
        ErrorCodeEnum.DIPLOMA_PRICE_SHOULD_BE_LESS_THAN_PROGRAM_PRICE
      );
    }

    const correctCalcs = progarms.reduce((acc, program) => {
      const { priceAfterDiscount, originalPrice } = program;
      const price = priceAfterDiscount ? priceAfterDiscount : originalPrice;
      acc[program.id] = +(((price / sumOfPrices) * diplomaPrice) / 100).toFixed(
        3
      );
      return acc;
    }, {});

    console.log(
      learnigPrograms.map(program => {
        return {
          input: program.PriceUnderDiploma / 100,
          calculated: correctCalcs[program.courseId]
        };
      })
    );

    const allAreCorrect = learnigPrograms?.map(program => {
      if (
        Math.floor(program.PriceUnderDiploma / 100) !==
        Math.floor(correctCalcs[program.courseId])
      ) {
        return false;
      }
      return true;
    });
    if (allAreCorrect.some(program => program !== true)) return false;
    return true;
  }
  async updateDiploma(
    input: UpdateDiplomaInput,
    currentUser: User
  ): Promise<Diploma> {
    const {
      diplomaId,
      learningPrograms,
      categoryId,
      skillsIds,
      toolsIds,
      updateActions,
      priceAfterDiscount,
      originalPrice
    } = input;

    let coursesCount = 0,
      workshopsCount = 0,
      lecturersIds: string[] = [];

    const diploma = await this.findDiplomaOrError(diplomaId);

    if (!categoryId && diploma.status === DiplomaStatusEnum.APPROVED) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    if (!learningPrograms || learningPrograms.length === 0) {
      throw new BaseHttpException(ErrorCodeEnum.SYLLABUS_SHOULD_NOT_BE_EMPTY);
    }

    const courses = await this.coursesRepo.findAll(
      {
        id: learningPrograms.map(e => e.courseId)
      },
      [
        {
          model: CourseLecturer
        }
      ]
    );

    courses.forEach(course => {
      if (course.type === CourseTypeEnum.COURSE) coursesCount++;
      if (course.type === CourseTypeEnum.WORKSHOP) workshopsCount++;

      course.courseLecturers.forEach((courseLecturer: CourseLecturer) => {
        if (!lecturersIds.includes(courseLecturer.lecturerId)) {
          lecturersIds.push(courseLecturer.lecturerId);
        }
      });
    });

    const lecturersCount = lecturersIds.length;

    const resolved = this.resolveDiplomaAccessData(input, diploma);

    this.validateAccessDuration(
      resolved.diplomaType,
      resolved.accessDurationPerMonths,
      resolved.status
    );

    const statusForVisibilityCheck =
      input.publicationStatus ?? diploma.publicationStatus;

    if (statusForVisibilityCheck === PublicationStatusEnum.PUBLIC) {
      const status = await this.programsPublicationStatus(learningPrograms);
      if (status === ProgramsPublicationStatusEnum.ALL_PRIVATE) {
        throw new BaseHttpException(ErrorCodeEnum.ALL_PROGRAMS_PRIVATE);
      }
      if (status === ProgramsPublicationStatusEnum.SOME_PRIVATE) {
        throw new BaseHttpException(ErrorCodeEnum.SOME_PROGRAMS_PRIVATE);
      }
    }

    const diplomaPriceBeforeUpdate =
      diploma.priceAfterDiscount >= 0 ?
        diploma.priceAfterDiscount
      : diploma.originalPrice;

    const originalPriceForValidation =
      input.originalPrice === undefined ?
        diploma.originalPrice
      : input.originalPrice;
    const priceAfterDiscountForValidation =
      input.priceAfterDiscount === undefined ?
        diploma.priceAfterDiscount
      : input.priceAfterDiscount;

    this.validateDiplomaPrice(
      originalPriceForValidation,
      priceAfterDiscountForValidation
    );

    let updatedDiplomaPrice = undefined;
    if (input.priceAfterDiscount >= 0 && input.priceAfterDiscount !== null) {
      updatedDiplomaPrice = input.priceAfterDiscount;
    } else if (
      !input.priceAfterDiscount &&
      !diploma.priceAfterDiscount &&
      input.originalPrice
    ) {
      updatedDiplomaPrice = input.originalPrice;
    }

    if (priceAfterDiscount !== undefined || originalPrice !== undefined) {
      const validPrices =
        await this.validatePricesOfLearningProgramsUnderDiploma(
          learningPrograms,
          priceAfterDiscount >= 0 && input.priceAfterDiscount !== null ?
            priceAfterDiscount
          : originalPrice,
          originalPrice
        );
      if (!validPrices) {
        throw new BaseHttpException(ErrorCodeEnum.WRONG_CALCS);
      }
    }

    if (input?.learningPrograms) {
      await this.handleDiplomaLearningProgramsUpdate(diplomaId, input);
    }

    if (categoryId) {
      const category = await this.categoryService.activeCategoryOrError(
        input.categoryId
      );
      await diploma.$set('category', category);
    }

    if (skillsIds) {
      await this.skillService.setSkills(diploma, skillsIds);
    }
    if (toolsIds) {
      await this.toolService.setTools(diploma, toolsIds);
    }

    await this.setDiplomaLearningPrograms(diploma.id, learningPrograms);

    if (updatedDiplomaPrice) {
      await this.pricingCalcsQueue.add(
        'ApplyTheImpactOfDiplomaPriceChangeOnCarts',
        {
          diplomaId,
          oldPrice: diplomaPriceBeforeUpdate,
          newPrice: updatedDiplomaPrice
        }
      );
      await this.updateCoursesUnderDiplomaPrice(diplomaId, updatedDiplomaPrice);
    }

    let diplomaDetail = await this.diplomaDetailsRepo.findOne({
      diplomaId
    });

    diplomaDetail = await this.diplomaDetailsRepo.updateOneFromExistingModel(
      diplomaDetail,
      {
        diplomaId: diploma.id,
        workshopsCount,
        coursesCount,
        lecturersCount,
        ...input
      }
    );

    if (input.thumbnail) {
      await this.uploaderService.setUploadedFilesReferences(
        [input.thumbnail],
        'diploma',
        'thumbnail',
        diploma.id
      );
      await this.uploaderService.removeOldFilesReferences(
        [input.thumbnail],
        [diploma.thumbnail]
      );
      await this.setDiplomaDetailsUploadedFilesReferences(diplomaDetail);
    }

    if (updateActions) {
      await this.logsRepo.createOne({
        programId: diploma.id,
        programType: LearningProgramTypeEnum.DIPLOMA,
        byId: currentUser.id,
        updateActions
      });
    }

    const updatedDiploma = await this.diplomaRepo.updateOneFromExistingModel(
      diploma,
      {
        ...input,
        priceAfterDiscount:
          input.hasOwnProperty('priceAfterDiscount') ?
            input.priceAfterDiscount
          : diploma.priceAfterDiscount
      }
    );

    if (diploma.publicationStatus === PublicationStatusEnum.PUBLIC) {
      Promise.resolve().then(() => {
        this.sendEmailsAndSiteNotificationsToUsers(
          updatedDiploma,
          EmailToUsersTypeEnum.PRICE_DISCOUNT,
          diplomaPriceBeforeUpdate
        ).catch(err => {
          console.error(err);
        });
      });
    }

    return updatedDiploma;
  }

  async sendEmailsAndSiteNotificationsToUsers(
    diploma: Diploma,
    emailType: EmailToUsersTypeEnum,
    diplomaPriceBeforeUpdate?: number,
    videoId: string = null
  ) {
    let template: Templates,
      subject: string,
      url: string,
      newDiplomaDetails: DiplomaDetail;

    let users: User[] = [];

    // Determine base path based on diploma type
    const basePath =
      diploma.diplomaType === DiplomaTypeEnum.SUBSCRIPTION ?
        'subscriptions'
      : 'paths';

    if (emailType === EmailToUsersTypeEnum.NEW_PROGRAM_AVAILABLE) {
      template = 'new-learning-program';
      subject = 'New Learning Opportunity';
      url = `${process.env.WEBSITE_URL}/${basePath}/${diploma.slug}`;

      users = await this.usersRepo.findAll(
        {
          role: UserRoleEnum.USER,
          email: { [Op.ne]: null },
          isBlocked: false,
          isDeleted: false
        },
        [],
        []
      );

      newDiplomaDetails = await this.diplomaDetailsRepo.findOne(
        {
          diplomaId: diploma.id
        },
        [],
        [],
        ['enSummary']
      );
    } else if (emailType === EmailToUsersTypeEnum.PRICE_DISCOUNT) {
      if (diploma.priceAfterDiscount >= diplomaPriceBeforeUpdate) {
        return;
      }

      template = 'offers-discount';
      subject = 'Special Discount on Your Selected Program!';
      url = `${process.env.WEBSITE_URL}/cart`;

      const cartItems = await this.cartItemRepo.findAll({
        learningProgramId: diploma.id
      });

      const cartIds = cartItems.map(ci => ci.cartId);

      users = await this.usersRepo.findAll(
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

    // Send Emails (loop)
    for (const user of users) {
      const templateData = {
        userName: user?.firstName ?? user?.enFullName?.split(' ')[0],
        programType:
          diploma?.type ?
            diploma.type.charAt(0).toUpperCase() +
            diploma.type.slice(1).toLowerCase()
          : undefined,
        programLevel: diploma?.level
          ?.toLowerCase()
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        learningTime: diploma?.learningTime,
        learningTimeUnit:
          diploma?.learningTimeUnit ?
            diploma.learningTimeUnit.toLowerCase() + 's'
          : undefined,
        programTitle: diploma?.enTitle,
        programImageUrl:
          diploma?.thumbnail ?
            `${
              process.env.NODE_ENV === 'development' ?
                'https://leiaqa.fra1.digitaloceanspaces.com/'
              : 'https://leiaqa-production.fra1.digitaloceanspaces.com/'
            }${diploma.thumbnail}`
          : undefined,
        programSummary:
          emailType === EmailToUsersTypeEnum.NEW_PROGRAM_AVAILABLE ?
            newDiplomaDetails?.enSummary
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

    // Prepare Notification (ONCE for all users)
    const notificationType =
      emailType === EmailToUsersTypeEnum.PRICE_DISCOUNT ?
        NotificationTypeEnum.SPECIAL_DISCOUNT_OFFER
      : NotificationTypeEnum.NEW_LEARNING_PROGRAM_AVAILABLE;

    const notificationEnBody =
      emailType === EmailToUsersTypeEnum.PRICE_DISCOUNT ?
        `We noticed you left ${diploma.enTitle} in your cart. Grab this exclusive discount before it’s gone!`
      : `Explore our latest ${diploma.enTitle} programs and level up your skills today.`;

    const notificationArBody =
      emailType === EmailToUsersTypeEnum.PRICE_DISCOUNT ?
        `لاحظنا أنك تركت ${diploma.arTitle} في سلة التسوق الخاصة بك. اغتنم هذا الخصم الحصري قبل أن ينتهي!`
      : `اكتشف أحدث ${diploma.arTitle} لدينا وطور مهاراتك اليوم`;

    const notificationUrl =
      emailType === EmailToUsersTypeEnum.PRICE_DISCOUNT ?
        `${process.env.WEBSITE_URL}/cart`
      : `${process.env.WEBSITE_URL}/${basePath}/${diploma.slug}`;

    await this.pusherQueue.add('pusher', {
      toUsers: [...users.map(t => t.dataValues)],
      notificationParentId: diploma.id,
      notificationParentType: NotificationParentTypeEnum.DIPLOMA,
      payloadData: {
        enTitle: `Leiaqa`,
        arTitle: `لياقة`,
        enBody: notificationEnBody,
        arBody: notificationArBody,
        url: notificationUrl,
        type: notificationType,
        notificationType: notificationType,
        videoId: videoId,
        targetId: diploma.id,
        TargetType: NotificationParentTypeEnum.DIPLOMA,
        targetModel: NotificationParentTypeEnum.DIPLOMA,
        targetType: NotificationParentTypeEnum.DIPLOMA
      }
    });
  }

  async handleDiplomaLearningProgramsUpdate(
    diplomaId: string,
    input: UpdateDiplomaInput
  ): Promise<void> {
    const diploma = await this.findDiplomaOrError(diplomaId);

    // Get existing programs under diploma
    const existingDiplomaCourses = await this.diplomaCoursesRepo.findAll(
      { diplomaId },
      [{ model: Course }]
    );

    const existedDiplomaLearningProgramsIds = existingDiplomaCourses.map(
      dc => dc.course.id
    );

    // Get programs that we need to add (new ones that don’t exist at all)
    const newLearningPrograms = input.learningPrograms.filter(
      lp => !existedDiplomaLearningProgramsIds.includes(lp.courseId)
    );

    // Add new programs
    if (newLearningPrograms.length > 0) {
      await this.diplomaCoursesRepo.bulkCreate(
        newLearningPrograms.map(lp => ({
          diplomaId,
          courseId: lp.courseId,
          commissionOfCourseUnderDiploma: lp?.commissionUnderDiploma,
          priceOfCourseUnderDiploma: Math.round(lp.PriceUnderDiploma * 100)
        }))
      );

      // Get all users already assigned to this diploma
      const usersInDiploma = await this.userAssignmentsRepo.findAll({
        diplomaId
      });

      const accessDuration =
        typeof input.accessDurationPerMonths === 'number' ?
          input.accessDurationPerMonths
        : diploma.accessDurationPerMonths;

      const accessExpiresAt =
        this.courseService.calculateAccessExpirationDate(accessDuration);

      // Assign each new program to each user using assignCoursesToUser
      for (const userAssignment of usersInDiploma) {
        await this.courseService.assignCoursesToUser(
          userAssignment.userId,
          newLearningPrograms.map(lp => lp.courseId),
          diplomaId,
          false,
          false,
          accessExpiresAt
        );
      }

      // Send emails and notifications to lecturers
      void this.sendEmailsAndSiteNotificationsToLecturers(
        diploma,
        newLearningPrograms
      );
    }

    // Handle courses that were previously keptForOldAssignments but are being re-added now
    const reactivatedCourses = existingDiplomaCourses.filter(
      dc =>
        dc.keptForOldAssignments === true &&
        input.learningPrograms.some(lp => lp.courseId === dc.course.id)
    );

    if (reactivatedCourses.length > 0) {
      for (const dc of reactivatedCourses) {
        const newProgram = input.learningPrograms.find(
          lp => lp.courseId === dc.course.id
        );
        await this.diplomaCoursesRepo.updateOne(
          { diplomaId, courseId: dc.course.id },
          {
            keptForOldAssignments: false,
            commissionOfCourseUnderDiploma: newProgram?.commissionUnderDiploma,
            priceOfCourseUnderDiploma: Math.round(
              newProgram?.PriceUnderDiploma * 100
            )
          }
        );
      }
    }

    // Handle programs to remove
    const learningProgramsIdsToBeRemoved =
      existedDiplomaLearningProgramsIds.filter(
        id => !input.learningPrograms.map(elp => elp.courseId).includes(id)
      );

    if (learningProgramsIdsToBeRemoved.length > 0) {
      for (const id of learningProgramsIdsToBeRemoved) {
        const usersAssignedToProgram = await this.userAssignmentsRepo.findAll({
          courseId: id,
          diplomaId
        });

        if (usersAssignedToProgram.length > 0) {
          // Keep it for old assignments
          await this.diplomaCoursesRepo.updateAll(
            { diplomaId, courseId: id },
            { keptForOldAssignments: true }
          );
        } else {
          // Delete completely
          await this.diplomaCoursesRepo.deleteAll({ diplomaId, courseId: id });
        }
      }
    }
  }

  async sendEmailsAndSiteNotificationsToLecturers(
    diploma: Diploma,
    newLearningPrograms: IDiplomaLearningPrograms[]
  ) {
    const newLearningProgramsIds = newLearningPrograms.map(lp => lp.courseId);

    // Determine base path based on diploma type
    const basePath =
      diploma.diplomaType === DiplomaTypeEnum.SUBSCRIPTION ?
        'subscriptions'
      : 'paths';

    const newLearningProgramsForEmails = await this.diplomaCoursesRepo.findAll(
      {
        diplomaId: diploma.id,
        courseId: newLearningProgramsIds,
        keptForOldAssignments: false
      },
      [
        {
          model: Course,
          attributes: ['id', 'enTitle', 'arTitle'],
          include: [
            {
              model: CourseLecturer,
              include: [{ model: Lecturer, include: [{ model: User }] }]
            }
          ]
        }
      ]
    );

    // sending emails and notifications to each lecturer of each course
    const emailAndNotificationPromises = [];

    newLearningProgramsForEmails.forEach(dc => {
      const course = dc.course;

      course.courseLecturers.forEach((courseLecturer: CourseLecturer) => {
        const user = courseLecturer.lecturer.user;
        if (!user?.email) return; // skip if no email

        emailAndNotificationPromises.push(
          this.mailService.send({
            to: user.email,
            subject: 'Your Content Has Been Added to a Diploma Program',
            template: 'be-added-for-diploma',
            templateData: {
              programTitle: course.enTitle,
              diplomaName: diploma.enTitle,
              lecturerName: user.firstName ?? user.enFullName.split(' ')[0],
              url: `${process.env.WEBSITE_URL}/${basePath}/${diploma.slug}`
            }
          })
        );

        emailAndNotificationPromises.push(
          this.siteNotificationService.createSiteNotification(
            SiteNotificationsTypeEnum.ADDED_TO_DIPLOMA,
            {
              userId: user.id,
              diplomaArTitle: diploma.arTitle,
              diplomaEnTitle: diploma.enTitle,
              programEnTitle: course.enTitle,
              programArTitle: course.arTitle,
              diplomaType: diploma.diplomaType,
              diplomaId: diploma.id
            }
          )
        );
      });
    });

    await Promise.allSettled(emailAndNotificationPromises);
  }

  async updateCoursesUnderDiplomaPrice(
    diplomaId: string,
    updatedDiplomaPrice: number
  ): Promise<void> {
    const courses = (
      await this.diplomaCoursesRepo.findAll(
        {
          diplomaId,
          keptForOldAssignments: false
        },
        [
          {
            model: Course
          }
        ]
      )
    ).map(x => x.course);

    const sumOfCoursesUnderDiplomaPrices = courses.reduce((acc, course) => {
      const { priceAfterDiscount, originalPrice } = course;
      let price = priceAfterDiscount ?? originalPrice;
      price = price / 100;
      return acc + price;
    }, 0);

    console.log('updatedDiplomaPrice', updatedDiplomaPrice);

    console.log(
      `sumOfCoursesUnderDiplomaPrices`,
      sumOfCoursesUnderDiplomaPrices
    );

    await Promise.all(
      courses.map(async course => {
        const { priceAfterDiscount, originalPrice } = course;
        let coursePrice = priceAfterDiscount ?? originalPrice;
        coursePrice = coursePrice / 100;

        console.log('coursePrice', coursePrice);
        console.log(
          'priceOfCourseUnderDiploma : ',
          (coursePrice / sumOfCoursesUnderDiplomaPrices) * updatedDiplomaPrice
        );
        console.log('---------------------');

        await this.diplomaCoursesRepo.updateOne(
          {
            diplomaId,
            courseId: course.id
          },
          {
            priceOfCourseUnderDiploma: Math.round(
              (coursePrice / sumOfCoursesUnderDiplomaPrices) *
                updatedDiplomaPrice
            )
          }
        );
      })
    );
  }
  async diplomaChangeLogs(diplomaId: string): Promise<Logs[]> {
    const logs = await this.logsRepo.findAll(
      {
        programId: diplomaId,
        programType: LearningProgramTypeEnum.DIPLOMA
      },
      [
        {
          model: User,
          as: 'by'
        }
      ],
      [['createdAt', 'DESC']]
    );
    return logs;
  }
  async deleteDiploma(diplomaId: string): Promise<number> {
    console.log('debugging_______ deleteDiploma __ id ', diplomaId, '______');

    const diploma = await this.findDiplomaOrError(diplomaId);

    // 1️) Delete diploma itself in a transaction
    const deletedCount = await this.sequelize.transaction(async transaction => {
      return await this.diplomaRepo.deleteAll({ id: diplomaId }, transaction);
    });

    // 2️) Clean up diploma data
    await this.diplomaDeletionQueue.add(CLEANUP_DIPLOMA_JOB, {
      diplomaId,
      collectionId: diploma.collectionId
    });

    return deletedCount;
  }

  async diploma(
    diplomaId?: string,
    slug?: string,
    publicationStatus?: PublicationStatusEnum
  ): Promise<Diploma> {
    if (!diplomaId && !slug) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    const where: any = {};

    if (diplomaId) {
      where.id = diplomaId;
    } else if (slug) {
      where.slug = slug;
    }

    if (publicationStatus) {
      where.publicationStatus = publicationStatus;
    }

    const diploma = await this.diplomaRepo.findOne(where);

    if (!diploma) {
      throw new BaseHttpException(ErrorCodeEnum.DIPLOMA_DOESNT_EXIST);
    }

    return diploma;
  }
  async diplomasBoard(
    filter?: FilterDiplomaInput,
    sort?: DiplomasBoardSortInput,
    paginator?: PaginatorInput
  ): Promise<PaginationRes<Diploma>> {
    const whereObj = {
      ...(filter?.categoryId && { categoryId: filter.categoryId }),
      ...(filter?.averageRating && { averageRating: filter.averageRating }),
      ...(filter?.collectionId && { collectionId: filter.collectionId }),
      ...(filter?.level && { level: filter.level }),
      ...(filter?.publicationStatus && {
        publicationStatus: filter.publicationStatus
      }),
      ...(filter?.status && { status: filter.status }),
      ...(filter.diplomaType && { diplomaType: filter.diplomaType }),

      ...(filter?.searchKey && {
        [Op.or]: [
          { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
          { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
          { code: { [Op.iLike]: `%${filter.searchKey}%` } }
        ]
      })
    };

    if (!filter?.lecturerId) {
      // this would make just one query
      const res = await this.diplomaRepo.findPaginated(
        whereObj,
        [
          [
            Sequelize.col(
              (sort?.sort?.sortBy !== DiplomaSortEnum.PROFIT ?
                sort?.sort?.sortBy
              : 'createdAt') || 'createdAt'
            ),
            sort?.sort?.sortType || SortTypeEnum.DESC
          ]
        ],
        paginator?.page || 1,
        paginator?.limit || 15,
        [
          {
            model: DiplomaDetail,
            required: true
          }
        ]
      );

      if (sort?.sort?.sortBy === DiplomaSortEnum.PROFIT) {
        //! applied only on returned items
        return {
          items: (await this.getItemsSortedByProfit(
            res.items,
            sort.sort.sortType
          )) as unknown as Diploma[],
          pageInfo: res.pageInfo
        };
      } else {
        return res;
      }
    }
    // lecturerId exists
    else {
      // this would make 3 queries .. :(
      return await this.handleDiplomasBoardWithLecturerIdInFilterInput(
        whereObj,
        filter,
        sort,
        paginator
      );
    }
  }
  async handleDiplomasBoardWithLecturerIdInFilterInput(
    whereObj?: any,
    filter?: FilterDiplomaInput,
    sort?: DiplomasBoardSortInput,
    paginator?: PaginatorInput
  ): Promise<PaginationRes<Diploma>> {
    const coursesIds = (
      await this.coursesRepo.findAll(
        {},
        [
          // {
          //   model: Lecturer,
          //   required: true,
          //   include: [
          //     {
          //       model: User,
          //       where: { id: filter?.lecturerId }
          //     }
          //   ]
          // }
          {
            model: CourseLecturer,
            required: true,
            include: [
              {
                model: Lecturer,
                required: true,
                include: [
                  {
                    model: User,
                    where: { id: filter?.lecturerId }
                  }
                ]
              }
            ]
          }
        ],
        undefined,
        ['id']
      )
    ).map(c => c.id);

    const diplomas = await this.diplomaRepo.findAll(whereObj, [
      {
        model: Course,
        where: { id: { [Op.in]: coursesIds } }
      }
    ]);

    const uniqueDiplomassIds = [...new Set(diplomas.map(d => d.id))];

    const res = await this.diplomaRepo.findPaginated(
      { id: { [Op.in]: uniqueDiplomassIds } },
      [
        [
          Sequelize.col(
            (sort?.sort?.sortBy !== DiplomaSortEnum.PROFIT ?
              sort?.sort?.sortBy
            : 'createdAt') || 'createdAt'
          ),
          sort?.sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginator?.page || 1,
      paginator?.limit || 15,
      [
        {
          model: DiplomaDetail,
          required: true
        }
      ]
    );

    if (sort?.sort?.sortBy === DiplomaSortEnum.PROFIT) {
      return {
        items: (await this.getItemsSortedByProfit(
          res.items,
          sort.sort.sortType
        )) as unknown as Diploma[],
        pageInfo: res.pageInfo
      };
    } else {
      return res;
    }
  }
  async getItemsSortedByProfit(
    items: Diploma[],
    sortType: SortTypeEnum
  ): Promise<any> {
    let itemsWithProfits = await Promise.all(
      items.map(async item => {
        const { id } = item;
        return {
          ...item,
          profit: (await this.revenueService.getDiplomaRevenue(id)).systemProfit
        };
      })
    );

    itemsWithProfits = itemsWithProfits.sort((a, b) => {
      return sortType === SortTypeEnum.ASC ?
          a.profit - b.profit
        : b.profit - a.profit;
    });
    return itemsWithProfits;
  }
  //************************* diplomas in the site view ***************************** */
  commonDiplomasSiteFilter(filter: DiplomasSiteFilterInput): any {
    return {
      publicationStatus: PublicationStatusEnum.PUBLIC,
      status: DiplomaStatusEnum.APPROVED,
      ...(filter?.categoryIds && {
        categoryId: { [Op.in]: filter.categoryIds }
      }),
      ...(filter?.price && { priceAfterDiscount: filter.price * 100 }), // *100 because it's stored in db *100
      ...(filter?.level && { level: { [Op.in]: filter?.level } }),
      ...(filter?.learningTime && { learningTime: filter.learningTime }),
      ...(filter?.searchKey && {
        [Op.or]: [
          { code: { [Op.iLike]: `%${filter.searchKey}%` } },
          { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
          { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } }
        ]
      }),
      ...(filter.diplomaType && { diplomaType: filter.diplomaType })
    };
  }
  commonDiplomaSiteSortOptions(sort: DiplomasBoardSortInput): any {
    return [
      [
        Sequelize.col(sort?.sort?.sortBy || 'createdAt'),
        sort?.sort?.sortType || SortTypeEnum.DESC
      ]
    ];
  }
  async diplomasSite(
    filter?: DiplomasSiteFilterInput,
    sort?: DiplomasBoardSortInput,
    paginator?: PaginatorInput
  ): Promise<PaginationRes<Diploma>> {
    if (filter?.lecturerId) {
      return await this.handleDiplomasSiteWithLecturerId(
        filter,
        sort,
        paginator
      );
    }

    return await this.diplomaRepo.findPaginated(
      {
        ...(filter?.excludedIds && {
          id: { [Op.notIn]: filter.excludedIds }
        }),

        ...this.commonDiplomasSiteFilter(filter),

        ...(filter?.searchKey && {
          [Op.or]: [
            { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.enName$': { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.arName$': { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        })
      },
      this.commonDiplomaSiteSortOptions(sort),
      paginator?.page || 1,
      paginator?.limit || 15,
      [
        {
          model: Category,
          as: 'category'
        }
      ]
    );
  }

  async handleDiplomasSiteWithLecturerId(
    filter?: DiplomasSiteFilterInput,
    sort?: DiplomasBoardSortInput,
    paginator?: PaginatorInput
  ): Promise<PaginationRes<Diploma>> {
    let lecturerCoursesIds: string[] = [];

    if (filter?.lecturerId) {
      const courseLecturers = await this.courseLecturersRepo.findAll({
        lecturerId: filter.lecturerId
      });

      lecturerCoursesIds = courseLecturers.map(cl => cl.courseId);
    }

    if (!lecturerCoursesIds.length) {
      throw new BaseHttpException(
        ErrorCodeEnum.NO_DIPLOMAS_CONTAIN_COURSES_FOR_THIS_LECTURER
      );
    }

    const uniqueDiplomasIds = (
      await this.diplomaCoursesRepo.findAll(
        {
          courseId: { [Op.in]: lecturerCoursesIds }
        },
        [],
        [],
        [[Sequelize.fn('DISTINCT', Sequelize.col('diplomaId')), 'diplomaId']]
      )
    ).map(e => e.diplomaId);

    const idFilter = {
      [Op.in]: uniqueDiplomasIds,
      ...(filter?.excludedIds && { [Op.notIn]: filter?.excludedIds })
    };

    return await this.diplomaRepo.findPaginated(
      {
        id: idFilter,
        ...this.commonDiplomasSiteFilter(filter)
      },
      this.commonDiplomaSiteSortOptions(sort),
      paginator?.page || 1,
      paginator?.limit || 15
    );
  }

  async diplomaCourses(
    diplomaId: string,
    pagination?: NullablePaginatorInput
  ): Promise<PaginationRes<Course>> {
    const coursesIds =
      (
        await this.diplomaCoursesRepo.findAll({
          diplomaId,
          keptForOldAssignments: false
        })
      ).map(e => e.courseId) || [];
    if (coursesIds)
      return await this.coursesRepo.findPaginated(
        { id: { [Op.in]: coursesIds } },
        [],
        pagination?.paginate?.page || 1,
        pagination.paginate?.limit || 15
      );
  }

  //****************************************************** */
  async diplomasWhereCourseIsPartOf(courseId: string): Promise<Diploma[]> {
    return (
      await this.diplomaCoursesRepo.findAll(
        {
          courseId,
          keptForOldAssignments: false
        },
        [{ model: Diploma, required: true }]
      )
    ).map(e => e.diploma);
  }
  async lecturerDiplomasBoard(
    filter?: lecturerDiplomasFilter,
    sort?: DiplomasBoardSortInput,
    paginator?: NullablePaginatorInput,
    currentUser?: User
  ): Promise<PaginationRes<Diploma>> {
    //** joins in the following query may make duplications .. ofc there is a better way to do it
    //** but this is the best way for now
    const diplomas = await this.diplomaRepo.findAll(
      {
        ...(filter?.publicationStatus && {
          publicationStatus: filter.publicationStatus
        }),
        ...(filter?.categoryId && { categoryId: filter?.categoryId }),
        ...(filter?.code && { code: filter.code }),
        ...(filter?.searchKey && {
          [Op.or]: [
            {
              enTitle: { [Op.iLike]: `%${filter?.searchKey}%` }
            },
            {
              arTitle: { [Op.iLike]: `%${filter?.searchKey}%` }
            },
            {
              code: { [Op.iLike]: `%${filter?.searchKey}%` }
            }
          ]
        })
      },
      [
        {
          model: Category,
          required: true,
          attributes: ['arName', 'enName']
        },
        {
          model: Course,
          required: true,
          include: [
            //   {
            //     model: Lecturer,
            //     where: { userId: currentUser?.id }
            //   }
            {
              model: CourseLecturer,
              include: [
                {
                  model: Lecturer,
                  where: { userId: currentUser?.id }
                }
              ]
            }
          ]
        }
      ]
    );

    const uniqueDiplomassIds = this.getUniqueObjects(diplomas, 'id').map(
      d => d.id
    );

    return await this.diplomaRepo.findPaginated(
      {
        id: {
          [Op.in]: uniqueDiplomassIds
        }
      },
      [
        [
          Sequelize.col(sort?.sort?.sortBy || 'createdAt'),
          sort?.sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginator?.paginate?.page || 1,
      paginator?.paginate?.limit || 15
    );
  }
  getUniqueObjects(array: any[], uniqueKey: string): any[] {
    return array.filter(
      (item, index, self) =>
        index === self.findIndex(t => t[uniqueKey] === item[uniqueKey])
    );
  }

  async diplomaPrograms(
    input: DiplomaProgramsInput,
    pagination: PaginatorInput = { page: 1, limit: 15 },
    sort?: DiplomaProgramsSortInput,
    filter?: DiplomaProgramsBoardFilterInput,
    currentUser?: User
  ): Promise<any> {
    const { diplomaId } = input;

    await this.findDiplomaOrError(diplomaId);

    // Fetch all related diploma courses
    const diplomaCourses = await this.diplomaCoursesRepo.findAll({
      diplomaId,
      keptForOldAssignments: false
    });

    const programIds = diplomaCourses.map(lp => lp.courseId);

    let lecturerId: string;
    if (filter?.filter?.userIdOfLecturer) {
      const lecturer = await this.usersRepo.findOne(
        { id: filter.filter.userIdOfLecturer },
        [{ model: Lecturer }]
      );

      lecturerId = lecturer?.lecturer?.id;

      if (!lecturerId) {
        throw new BaseHttpException(ErrorCodeEnum.LECTURER_DOESNT_EXIST);
      }
    }

    let userAssignedCourseIds: string[] = [];

    if (currentUser?.role === UserRoleEnum.USER) {
      // Get private courses that the user is assigned to
      const userAssignments = await this.userAssignmentsRepo.findAll({
        diplomaId,
        userId: currentUser.id
      });

      userAssignedCourseIds = userAssignments.map(
        assignment => assignment.courseId
      );
    }

    const whereClause: any = {
      id: programIds,
      ...(filter?.filter?.programType && {
        type: filter.filter.programType
      }),
      ...(lecturerId && {
        courseLecturers: { lecturerId }
      })
    };

    if (!currentUser) {
      whereClause.publicationStatus = 'PUBLIC';
    } else if (currentUser.role === UserRoleEnum.USER) {
      whereClause[Op.or] = [
        { publicationStatus: 'PUBLIC' },
        { id: userAssignedCourseIds }
      ];
    }

    const allCourses = await this.coursesRepo.findAll(
      whereClause,
      [
        {
          model: CourseLecturer,
          include: [{ model: Lecturer, include: [{ model: User }] }]
        }
      ],
      [[Sequelize.col('createdAt'), sort?.sort?.sortType || SortTypeEnum.DESC]]
    );

    // Attach the "addedToDiplomaAt" field
    const coursesWithAddedAt = allCourses.map(course => {
      const diplomaCourse = diplomaCourses.find(
        dc => dc.courseId === course.id
      );
      return {
        ...course.dataValues,
        addedToDiplomaAt: diplomaCourse?.createdAt || null
      };
    });

    // Remove duplicates by course id
    const uniqueCourses = this.getUniqueObjects(coursesWithAddedAt, 'id');

    const { page, limit } = pagination || { page: 1, limit: 15 };
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedResult = uniqueCourses.slice(startIndex, endIndex);

    return {
      items: paginatedResult,
      pageInfo: {
        page,
        limit,
        hasBefore: page > 1,
        hasNext: uniqueCourses.length > endIndex,
        totalCount: uniqueCourses.length,
        totalPages: Math.ceil(uniqueCourses.length / limit)
      }
    };
  }

  async usersForDiplomaAssignment(
    diplomaId: string,
    searchKey?: string,
    pagination?: NullablePaginatorInput
  ): Promise<PaginationRes<User>> {
    await this.findDiplomaOrError(diplomaId);
    const diplomaCoursesIds = (
      await this.diplomaCoursesRepo.findAll({
        diplomaId,
        keptForOldAssignments: false
      })
    ).map(dc => dc.courseId);

    const assignedUsersIds = (
      await this.userAssignmentsRepo.findAll(
        {
          diplomaId,
          courseId: diplomaCoursesIds
        },
        [
          {
            model: User,
            required: true
          }
        ]
      )
    ).map(ua => ua?.user?.id);

    return await this.usersRepo.findPaginated(
      {
        id: { [Op.notIn]: assignedUsersIds },
        role: UserRoleEnum.USER,
        unverifiedEmail: null,
        isDeleted: false,
        ...(searchKey && {
          [Op.or]: [
            {
              arFullName: { [Op.iLike]: `%${searchKey}%` }
            },
            {
              enFullName: { [Op.iLike]: `%${searchKey}%` }
            }
          ]
        })
      },
      [[Sequelize.col('createdAt'), SortTypeEnum.DESC]],
      pagination?.paginate?.page || 1,
      pagination?.paginate?.limit || 15
    );
  }

  async assignUsersToDiploma(
    input: AssignUsersToDiplomaInput
  ): Promise<boolean> {
    const { diplomaId, usersIds } = input;

    const diploma = await this.findDiplomaOrError(input.diplomaId);

    //get the diploma courses ids
    const diplomaCoursesIds = (
      await this.diplomaCoursesRepo.findAll({
        diplomaId,
        keptForOldAssignments: false
      })
    ).map(dc => dc.courseId);

    const notAssignedUsersIds = await this.idsOfUsersNotAssignedToDiploma(
      diplomaId,
      usersIds
    );

    // if the user is already assigned to all the diploma courses, no need to assign again then throw an error
    if (notAssignedUsersIds.length > 0) {
      for (const userId of notAssignedUsersIds) {
        const userCoursesAssignments = await this.userAssignmentsRepo.findAll({
          userId,
          courseId: diplomaCoursesIds
        });

        if (userCoursesAssignments.length === diplomaCoursesIds.length) {
          throw new BaseHttpException(
            ErrorCodeEnum.ALREADY_ASSIGNED_TO_ALL_COURSES_IN_DIPLOMA,
            { userId }
          );
        }
      }
    }

    if (notAssignedUsersIds.length > 0) {
      notAssignedUsersIds?.forEach(async userId => {
        try {
          await this.courseService.assignDiplomaToUser(
            userId,
            diplomaId,
            null,
            true
          );
        } catch (error) {
          console.log(error);
        }
      });
    }

    await this.diplomaDetailsRepo.updateAll(
      {
        diplomaId
      },
      {
        enrolledUsersCount:
          diploma?.diplomaDetail?.enrolledUsersCount +
          notAssignedUsersIds.length
      }
    );

    const diplomaCourses = await this.diplomaCoursesRepo.findAll(
      {
        diplomaId,
        keptForOldAssignments: false
      },
      [{ model: Course }]
    );

    // Update enrolledUsersCount for each course in the diploma
    for (const diplomaCourse of diplomaCourses) {
      const course = diplomaCourse.course;
      if (!course) continue;

      const courseDetail = await this.courseDetailsRepo.findOne({
        courseId: course.id
      });

      if (courseDetail) {
        await this.courseDetailsRepo.updateOneFromExistingModel(courseDetail, {
          enrolledUsersCount:
            (courseDetail.enrolledUsersCount || 0) + notAssignedUsersIds.length
        });
      }
    }

    // Remove assigned diploma (and its courses) from user's cart
    for (const userId of notAssignedUsersIds) {
      const cart = await this.cartRepo.findOne({ userId }, [
        { model: CartItem, as: 'cartItems' }
      ]);

      if (cart && cart.cartItems?.length > 0) {
        // filter cart items: diploma itself OR any course belonging to it
        const assignedCartItems = cart.cartItems.filter(
          item =>
            item.learningProgramId === diploma.id ||
            diplomaCoursesIds.includes(item.learningProgramId)
        );

        for (const cartItem of assignedCartItems) {
          await this.cartService.deleteCartItem(
            { id: userId } as User,
            cartItem.id
          );
        }
      }
    }

    // send notifications to users that they have been assigned to a diploma
    void this.sendNotificationsToUsers(diploma, notAssignedUsersIds);
    return true;
  }

  async idsOfUsersNotAssignedToDiploma(
    diplomaId: string,
    usersIds: string[]
  ): Promise<string[]> {
    const alreadyAssignedIds = (
      await this.userAssignmentsRepo.findAll(
        {
          diplomaId,
          userId: usersIds
        },
        [
          {
            model: User,
            required: true
          }
        ]
      )
    ).map(ua => ua.user.id);
    return usersIds.filter(id => !alreadyAssignedIds.includes(id));
  }
  /*********************** //*********************** //*********************** //*********************** //*********************** */
  validateDiplomaPrice(
    originalPrice: number,
    priceAfterDiscount: number
  ): void {
    if (originalPrice == 0 && priceAfterDiscount == 0) return;
    if (
      (!originalPrice && priceAfterDiscount != null) ||
      (originalPrice &&
        priceAfterDiscount != null &&
        priceAfterDiscount >= originalPrice)
    ) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_DISCOUNT);
    }
  }
  async setDiplomaLearningPrograms(
    diplomaId: string,
    learnigPrograms: IDiplomaLearningPrograms[],
    diplomaIsFree = false,
    transaction?: Transaction
  ): Promise<void> {
    const coursesIds = learnigPrograms.map(e => e.courseId);
    // console.log(
    //   'learning programs in setDiplomaLearningPrograms',
    //   learnigPrograms
    // );

    await this.diplomaCoursesRepo.deleteAll(
      {
        diplomaId,
        courseId: coursesIds
      },
      transaction
    );

    await this.diplomaCoursesRepo.bulkCreate(
      learnigPrograms?.map(lp => {
        return {
          diplomaId,
          courseId: lp?.courseId,
          commissionOfCourseUnderDiploma:
            diplomaIsFree ? 0 : lp?.commissionUnderDiploma,
          priceOfCourseUnderDiploma: lp?.PriceUnderDiploma
        };
      }),
      transaction
    );
  }
  async setDiplomaUploadedFilesReferences(
    diploma: Diploma,
    transaction: Transaction
  ): Promise<void> {
    if (diploma.thumbnail)
      await this.uploaderService.setUploadedFilesReferences(
        [diploma.thumbnail],
        'diploma',
        'thumbnail',
        diploma.id,
        transaction
      );
  }
  async setDiplomaDetailsUploadedFilesReferences(
    diplomaDetail: DiplomaDetail,
    transaction?: Transaction
  ): Promise<void> {
    if (diplomaDetail.promoVideo)
      await this.uploaderService.setUploadedFilesReferences(
        [diplomaDetail.promoVideo],
        'diplomaDetail',
        'promoVideo',
        diplomaDetail.id,
        transaction
      );

    if (diplomaDetail.outcomes?.length)
      await this.uploaderService.setUploadedFilesReferences(
        diplomaDetail.outcomes,
        'diplomaDetail',
        'outcomes',
        diplomaDetail.id,
        transaction
      );
  }
  async unassignUsersFromDiploma(
    input: AssignUsersToDiplomaInput
  ): Promise<boolean> {
    await this.findDiplomaOrError(input.diplomaId);

    const assigned = await this.userAssignmentsRepo.findAll({
      diplomaId: input.diplomaId,
      userId: { [Op.in]: input.usersIds }
    });

    if (assigned.length === 0)
      throw new BaseHttpException(
        ErrorCodeEnum.USER_ALREADY_UNASSIGNED_TO_DIPLOMA
      );

    const diplomaLearningPrograms = (
      await this.diplomaCoursesRepo.findAll(
        {
          diplomaId: input.diplomaId,
          keptForOldAssignments: false
        },
        [
          {
            model: Course
          }
        ]
      )
    ).map(lp => lp.course);

    //----------
    for (const userId of input.usersIds) {
      await this.courseService.unassignUserFromLearningProgram({
        userId,
        diplomaId: input.diplomaId,
        learningPrograms: diplomaLearningPrograms.map(lp => ({
          learningProgramId: lp.id,
          learningProgramType: LearningProgramTypeEnum.COURSE
        }))
      });
    }
    //----------

    const diplomaDetail = await this.diplomaDetailsRepo.findOne({
      diplomaId: input.diplomaId
    });

    await this.diplomaDetailsRepo.updateOneFromExistingModel(diplomaDetail, {
      enrolledUsersCount:
        diplomaDetail.enrolledUsersCount - input.usersIds.length
    });

    // refund logic
    // input.usersIds.map(async userId => {
    //   this.eventEmitter.emitAsync(
    //     REFUND_USER_IF_UNASSIGNED_EVENT,
    //     this.getUserUnassignedEventPayload(
    //       userId,
    //       input.diplomaId,
    //       UpperCaseLearningProgramTypeEnum.DIPLOMA
    //     )
    //   );
    // });

    return true;
  }
  async getTotalLessonsForDiploma(diplomaId: string): Promise<number> {
    const diplomaCourses = (
      await this.diplomaCoursesRepo.findAll(
        { diplomaId, keptForOldAssignments: false },
        [{ model: Course }]
      )
    ).map(x => x.course);

    let totalLessons = 0;
    for (const course of diplomaCourses) {
      totalLessons += course.courseSections.length;
    }

    return totalLessons;
  }
  async getUserCompletedLessonsForDiploma(
    diplomaId: string,
    userId: string
  ): Promise<{ completedLessons: number; totalLessons: number }> {
    const diplomaCourses = (
      await this.diplomaCoursesRepo.findAll(
        { diplomaId, keptForOldAssignments: false },
        [{ model: Course }]
      )
    ).map(x => x.course);

    let diplomaCompletedLessons: number = 0;
    let diplomaTotalLessons: number = 0;

    for (const course of diplomaCourses) {
      const { completedLessons, totalLessons }: UserCourseProgress =
        await this.userService.getUserCourseProgress(userId, course.id);
      diplomaCompletedLessons += completedLessons;
      diplomaTotalLessons += totalLessons;
    }

    return {
      completedLessons: diplomaCompletedLessons,
      totalLessons: diplomaTotalLessons
    };
  }
  //todo .. refactor this as much as possible ...ya mr ibrahim
  async usersAssignedDiploma(
    diplomaId: string,
    { sort }: DiplomaUsersBoardSortInput,
    paginate?: PaginatorInput,
    filter?: FilterDiplomaUsersInput
  ) {
    let allResults = await this.userAssignmentsRepo.findAll(
      { diplomaId },
      [{ model: User, as: 'user' }],
      [
        [
          this.sequelize.col(
            (sort?.sortBy !== UsersSortEnum.PROGRESS ?
              sort?.sortBy
            : 'createdAt') || 'createdAt'
          ),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ]
    );

    allResults = allResults.map(x => x.dataValues);

    const uniqueUsersMap = new Map<string, any>();
    allResults.forEach(x => {
      const user = x.user?.dataValues || x.user;

      if (!uniqueUsersMap.has(user.id)) {
        uniqueUsersMap.set(user.id, {
          ...user,
          joinedDiplomaAt: x.createdAt,
          completedLessons: 0,
          totalLessons: 0,
          completeDiploma: false
        });
      }
    });

    const uniqueUsers = Array.from(uniqueUsersMap.values());

    const diplomaCourses = (
      await this.diplomaCoursesRepo.findAll(
        { diplomaId, keptForOldAssignments: false },
        [{ model: Course }]
      )
    ).map(x => x.course.dataValues);

    const finalUsers = await Promise.all(
      uniqueUsers.map(async user => {
        for (const course of diplomaCourses) {
          const { completedLessons = 0, totalLessons = 0 }: UserCourseProgress =
            await this.userService.getUserCourseProgress(user.id, course.id);

          user.completedLessons += Number(completedLessons) || 0;
          user.totalLessons += Number(totalLessons) || 0;
        }

        user.completeDiploma = user.completedLessons === user.totalLessons;
        return user;
      })
    );

    let filteredUsers = finalUsers;

    // === Filter by progress ===
    if (filter?.Progress === CourseUserFilterEnum.COMPLETED) {
      filteredUsers = filteredUsers.filter(
        user => user.completedLessons === user.totalLessons
      );
    } else if (filter?.Progress === CourseUserFilterEnum.PROGRESS) {
      filteredUsers = filteredUsers.filter(
        user => user.completedLessons !== user.totalLessons
      );
    }

    // === Filter by isBanned ===
    if (filter?.isBlocked !== undefined) {
      filteredUsers = filteredUsers.filter(
        user => Boolean(user.isBlocked) === Boolean(filter.isBlocked)
      );
    }

    // === Filter by isDeleted ===
    if (filter?.isDeleted !== undefined) {
      filteredUsers = filteredUsers.filter(
        user => Boolean(user.isDeleted) === Boolean(filter.isDeleted)
      );
    }

    // === Sort by progress if requested ===
    if (sort?.sortBy === UsersSortEnum.PROGRESS) {
      if (sort?.sortType === SortTypeEnum.ASC) {
        filteredUsers.sort((a, b) => {
          const progressA = a.completeDiploma ? 1 : 0;
          const progressB = b.completeDiploma ? 1 : 0;
          return progressA - progressB;
        });
      } else {
        filteredUsers.sort((a, b) => {
          const progressA = a.completeDiploma ? 1 : 0;
          const progressB = b.completeDiploma ? 1 : 0;
          return progressB - progressA;
        });
      }
    }

    // === Pagination ===
    const page = paginate?.page || 1;
    const limit = paginate?.limit || 15;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedItems = filteredUsers.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      pageInfo: {
        limit,
        page,
        totalCount: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    };
  }
  async toggleDiplomaPublicationStatus(diplomaId: string): Promise<Diploma> {
    const diploma = await this.findDiplomaOrError(diplomaId);
    return await this.diplomaRepo.updateOneFromExistingModel(diploma, {
      publicationStatus:
        diploma.publicationStatus === PublicationStatusEnum.PUBLIC ?
          PublicationStatusEnum.PRIVATE
        : PublicationStatusEnum.PUBLIC
    });
  }

  async recommendedDiplomas(
    diplomaId: string,
    filter?: { diplomaType?: DiplomaTypeEnum }
  ): Promise<Diploma[]> {
    // 1. Validate diploma existence
    const diploma = await this.diplomaRepo.findOne({ id: diplomaId });

    if (!diploma) {
      throw new BaseHttpException(ErrorCodeEnum.DIPLOMA_DOESNT_EXIST);
    }

    let recommendedDiplomas: Diploma[] = [];

    // 3. Try to get diplomas from the same category
    recommendedDiplomas = await this.diplomaRepo.findAll(
      {
        id: { [Op.not]: diplomaId },
        categoryId: diploma.categoryId,
        publicationStatus: PublicationStatusEnum.PUBLIC,
        status: DiplomaStatusEnum.APPROVED,
        ...(filter.diplomaType && { diplomaType: filter.diplomaType })
      },
      [],
      [[this.sequelize.col('createdAt'), SortTypeEnum.DESC]]
    );

    // 4. If results are less than 2, fallback to most enrolled diplomas
    if (recommendedDiplomas.length < 2) {
      recommendedDiplomas = await this.diplomaRepo.findAll(
        {
          id: { [Op.not]: diplomaId },
          publicationStatus: PublicationStatusEnum.PUBLIC,
          status: DiplomaStatusEnum.APPROVED,
          ...(filter.diplomaType && { diplomaType: filter.diplomaType })
        },
        [
          {
            model: DiplomaDetail,
            as: 'diplomaDetail'
          }
        ],
        [
          [
            this.sequelize.col('diplomaDetail.enrolledUsersCount'),
            SortTypeEnum.DESC
          ]
        ]
      );
    }

    // 5. If still less than 2, fallback to most recent diplomas
    if (recommendedDiplomas.length < 2) {
      recommendedDiplomas = await this.diplomaRepo.findAll(
        {
          id: { [Op.not]: diplomaId },
          publicationStatus: PublicationStatusEnum.PUBLIC,
          status: DiplomaStatusEnum.APPROVED,
          ...(filter.diplomaType && { diplomaType: filter.diplomaType })
        },
        [],
        [[this.sequelize.col('createdAt'), SortTypeEnum.DESC]]
      );
    }

    // 6. Return only the top 2 recommended diplomas
    return recommendedDiplomas.slice(0, 2);
  }
  async coursesAndWorkshopsCount(
    diploma: Diploma,
    currentUser?: User
  ): Promise<coursesAndWorkshopsCountOutput> {
    if (!diploma) {
      return {
        coursesCount: 0,
        workshopsCount: 0,
        totalLessonsCount: 0
      };
    }

    let coursesCount = 0,
      workshopsCount = 0,
      totalLessonsCount = 0;

    // Fetch all related diploma courses with pagination
    const diplomaCourses = await this.diplomaCoursesRepo.findAll({
      diplomaId: diploma.id,
      keptForOldAssignments: false
    });

    const programIds = diplomaCourses.map(lp => lp.courseId);

    let userAssignedCourseIds: string[] = [];

    if (currentUser?.role === UserRoleEnum.USER) {
      // Get private courses that the user is assigned to
      const userAssignments = await this.userAssignmentsRepo.findAll({
        diplomaId: diploma.id,
        userId: currentUser.id
      });

      userAssignedCourseIds = userAssignments.map(
        assignment => assignment.courseId
      );
    }

    // Define filtering rules based on user role
    const whereClause: any = { id: programIds };

    if (!currentUser) {
      // Guest user: only see public programs
      whereClause.publicationStatus = 'PUBLIC';
    } else if (currentUser.role === UserRoleEnum.USER) {
      // Regular user: see public + assigned private courses
      whereClause[Op.or] = [
        { publicationStatus: 'PUBLIC' },
        { id: userAssignedCourseIds }
      ];
    }

    // Fetch courses based on constructed conditions
    const courses = await this.coursesRepo.findAll(whereClause, [
      {
        model: Section,
        attributes: ['id'],
        include: [{ model: Lesson, attributes: ['id', 'sectionId'] }]
      }
    ]);

    courses?.forEach(dc => {
      dc?.courseSections?.forEach(cs => {
        cs.lessons.forEach(() => {
          totalLessonsCount += 1;
        });
      });

      if (dc?.type === CourseTypeEnum.COURSE) {
        coursesCount++;
      } else {
        workshopsCount++;
      }
    });

    return {
      coursesCount,
      workshopsCount,
      totalLessonsCount
    };
  }

  async addedOn(courseId: string, diplomaId: string): Promise<any> {
    return (
      await this.diplomaCoursesRepo.findOne({
        diplomaId,
        courseId,
        keptForOldAssignments: false
      })
    ).createdAt;
  }
  async diplomaReviews(diplomaId: string): Promise<Review[]> {
    return await this.reviewsRepo.findAll({
      learningProgramId: diplomaId
    });
  }
  async userProgressByPrograms(
    diplomaId: string,
    userId: string
  ): Promise<userProgressByPrograms> {
    const allDiplomaPrograms = await this.diplomaCoursesRepo.findAll({
      diplomaId
    });

    const completedPrograms = await this.userAssignmentsRepo.findAll({
      diplomaId,
      courseId: {
        [Op.in]: allDiplomaPrograms?.map(program => program.courseId)
      },
      userId,
      completed: true
    });

    return {
      totalProgramsCount: allDiplomaPrograms?.length,
      completedProgramsCount: completedPrograms?.length
    };
  }

  // find the diploma public courses and workshops to recalculate the counts in the diploma details
  async recalculateDiplomaCounts(
    diplomaDetails: DiplomaDetail
  ): Promise<DiplomaDetail> {
    const lecturersIds: Set<string> = new Set();
    let coursesCount = 0,
      workshopsCount = 0;

    const publicDiplomaPrograms: DiplomaCourses[] =
      await this.diplomaCoursesRepo.findAll(
        {
          diplomaId: diplomaDetails.diplomaId,
          keptForOldAssignments: false
        },
        [
          {
            model: Course,
            required: true,
            attributes: ['id', 'type', 'status', 'publicationStatus'],
            where: {
              publicationStatus: PublicationStatusEnum.PUBLIC
            },
            include: [
              {
                model: CourseLecturer,
                attributes: ['lecturerId'],
                required: false
              }
            ]
          }
        ]
      );

    for (const program of publicDiplomaPrograms) {
      const course = program.course;

      if (!course) continue;

      if (course.type === CourseTypeEnum.COURSE) {
        coursesCount += 1;
      } else {
        workshopsCount += 1;
      }

      if (course.courseLecturers && course.courseLecturers.length > 0) {
        course.courseLecturers.forEach(cl => {
          if (!lecturersIds.has(cl.lecturerId)) {
            lecturersIds.add(cl.lecturerId);
          }
        });
      }
    }

    diplomaDetails.lecturersCount = lecturersIds.size;
    diplomaDetails.coursesCount = coursesCount;
    diplomaDetails.workshopsCount = workshopsCount;

    return diplomaDetails;
  }

  async sendNotificationsToUsers(
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

    const users = await this.usersRepo.findAll({
      id: notAssignedUsersIds,
      email: { [Op.ne]: null }
    });

    // Determine base path based on diploma type
    const basePath =
      diploma.diplomaType === DiplomaTypeEnum.SUBSCRIPTION ?
        'subscriptions'
      : 'paths';

    await this.pusherQueue.add('pusher', {
      toUsers: [...users.map(t => t.dataValues)],
      notificationParentId: diploma.id,
      notificationParentType: NotificationParentTypeEnum.DIPLOMA,
      payloadData: {
        enTitle: `Leiaqa`,
        arTitle: `لياقة`,
        enBody: `Great news! The admin has assigned you to ${diploma.enTitle}. You can now access the course materials and start learning.`,
        arBody: `خبر رائع! تم إلحاقك بـ ${diploma.arTitle}. يمكنك الآن الوصول إلى محتويات الدورة والبدء في التعلم.`,
        url: `${process.env.WEBSITE_URL}/${basePath}/${diploma.slug}`,
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

  async diplomasForSiteMap() {
    const diplomas = await this.diplomaRepo.findAll(
      {
        publicationStatus: PublicationStatusEnum.PUBLIC,
        status: DiplomaStatusEnum.APPROVED
      },
      [],
      [],
      ['id', 'updatedAt']
    );

    return diplomas.map(d => {
      return {
        id: d.id,
        updatedAt: d.updatedAt,
        type: LearningProgramTypeEnum.DIPLOMA
      };
    });
  }

  async assigned(programId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;
    return !!(await this.userAssignmentsRepo.findOne({
      userId,
      diplomaId: programId
    }));
  }

  async updateProgramUsersCounts(): Promise<boolean> {
    // 1. Get all user assignments
    const allAssignments = await this.userAssignmentsRepo.findAll(
      {},
      [],
      [],
      ['userId', 'courseId', 'diplomaId']
    );

    // 2. Maps to store unique user sets
    const courseUsersMap = new Map<string, Set<string>>();
    const diplomaUsersMap = new Map<string, Set<string>>();

    for (const { userId, courseId, diplomaId } of allAssignments) {
      // === Courses ===
      if (courseId && userId) {
        if (!courseUsersMap.has(courseId)) {
          courseUsersMap.set(courseId, new Set());
        }
        courseUsersMap.get(courseId)!.add(userId);
      }

      // === Diplomas ===
      if (diplomaId && userId) {
        if (!diplomaUsersMap.has(diplomaId)) {
          diplomaUsersMap.set(diplomaId, new Set());
        }
        diplomaUsersMap.get(diplomaId)!.add(userId);
      }
    }

    // 3. Update course details counts
    for (const [courseId, usersSet] of courseUsersMap.entries()) {
      const count = usersSet.size;
      const courseDetail = await this.courseDetailsRepo.findOne({ courseId });
      if (courseDetail) {
        await this.courseDetailsRepo.updateOneFromExistingModel(courseDetail, {
          enrolledUsersCount: count
        });
      }
    }

    // 4. Update diploma details counts
    for (const [diplomaId, usersSet] of diplomaUsersMap.entries()) {
      const count = usersSet.size;
      const diplomaDetail = await this.diplomaDetailsRepo.findOne({
        diplomaId
      });
      if (diplomaDetail) {
        await this.diplomaDetailsRepo.updateOneFromExistingModel(
          diplomaDetail,
          {
            enrolledUsersCount: count
          }
        );
      }
    }
    return true;
  }

  private validateAccessDuration(
    diplomaType: DiplomaTypeEnum,
    accessDurationPerMonths?: number,
    status: DiplomaStatusEnum = DiplomaStatusEnum.DRAFTED
  ) {
    const hasDuration = accessDurationPerMonths != null;

    if (hasDuration && accessDurationPerMonths <= 0) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_ACCESS_DURATION);
    }

    if (diplomaType === DiplomaTypeEnum.PATH && hasDuration) {
      throw new BaseHttpException(
        ErrorCodeEnum.ACCESS_DURATION_NOT_ALLOWED_FOR_PATH_DIPLOMA
      );
    }

    if (
      diplomaType === DiplomaTypeEnum.SUBSCRIPTION &&
      status === DiplomaStatusEnum.APPROVED &&
      !hasDuration
    ) {
      throw new BaseHttpException(
        ErrorCodeEnum.INVALID_ACCESS_DURATION_FOR_SUBSCRIPTION_DIPLOMA
      );
    }
  }

  private resolveDiplomaAccessData(
    input: UpdateDiplomaInput,
    diploma: Diploma
  ) {
    return {
      diplomaType: input.diplomaType ?? diploma.diplomaType,

      status: input.status ?? diploma.status,

      accessDurationPerMonths:
        input.hasOwnProperty('accessDurationPerMonths') ?
          input.accessDurationPerMonths
        : diploma.accessDurationPerMonths
    };
  }

  async generateUniqueSlug(diploma: Diploma, enTitle: string): Promise<string> {
    if (!enTitle) return '';

    const baseSlug = slugify(enTitle, { lowercase: true });
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (
      await this.diplomaRepo.findOne({
        slug: uniqueSlug,
        id: { [Op.ne]: diploma.id } // ignore current diploma
      })
    ) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    return uniqueSlug;
  }

  async getDiplomaCoursesAnalytics(
    diplomaId: string,
    paginate?: PaginatorInput
  ): Promise<PaginationRes<DiplomaAnalytics>> {
    const page = paginate?.page ?? 1;
    const limit = paginate?.limit ?? 15;
    const offset = (page - 1) * limit;

    // Phase 1: fetch all courses for the diploma with their views count
    const allRows: DiplomaAnalyticsRow[] =
      await this.sequelize.query<DiplomaAnalyticsRow>(
        `
      SELECT
        c.id AS "courseId",
        c."enTitle" AS "enTitle",
        c."arTitle" AS "arTitle",
        c."thumbnail" AS "thumbnail",
        c."code" AS "code",
        COUNT(v.id) AS "viewsCount",
        COUNT(v.id) > 0 AS "viewed"
      FROM "Courses" c
      LEFT JOIN "UserCourseDiplomaViews" v
        ON v."courseId" = c.id
        AND v."diplomaId" = :diplomaId
      LEFT JOIN "DiplomaCourses" dc
        ON dc."courseId" = c.id
      WHERE dc."diplomaId" = :diplomaId
      GROUP BY c.id
      ORDER BY "viewsCount" DESC
      `,
        {
          replacements: { diplomaId },
          type: QueryTypes.SELECT
        }
      );

    // Calculate total views for the whole diploma
    const totalViews = allRows.reduce(
      (sum, row) => sum + Number(row.viewsCount),
      0
    );

    const totalCount = allRows.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Phase 2: paginate the rows
    const paginatedRows = allRows.slice(offset, offset + limit);

    // Map the rows to DiplomaAnalytics including views percentage
    const items: DiplomaAnalytics[] = paginatedRows.map(row => ({
      courseData: {
        id: row.courseId,
        enTitle: row.enTitle,
        arTitle: row.arTitle,
        thumbnail: row.thumbnail,
        code: row.code
      } as DiplomaAnalyticsCourse,
      viewsCount: Number(row.viewsCount),
      viewed: row.viewed,
      viewsPercentage:
        totalViews > 0 ?
          Number(((Number(row.viewsCount) / totalViews) * 100).toFixed(2))
        : 0 // if totalViews is 0, percentage is 0
    }));

    return {
      items,
      pageInfo: {
        page,
        limit,
        hasNext: page < totalPages,
        hasBefore: page > 1,
        totalPages,
        totalCount
      }
    };
  }
}
