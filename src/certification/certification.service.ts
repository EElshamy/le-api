import { Inject, Injectable } from '@nestjs/common';
import { S3Service } from '@src/_common/aws/s3/s3.service';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import {
  NullablePaginatorInput,
  PaginatorInput
} from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { CertificateLang } from '@src/_common/pdf/enums/pdf-resource.enum';
import { PdfService } from '@src/_common/pdf/pdf.service';
import { UpperCaseLearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { CourseTimeUnit, CourseTypeEnum } from '@src/course/enums/course.enum';
import { SearchSortInput } from '@src/course/inputs/search.types';
import { Course } from '@src/course/models/course.model';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { DiplomaService } from '@src/diploma/diploma.service';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { User } from '@src/user/models/user.model';
import { UserService } from '@src/user/services/user.service';
import { Op, Sequelize } from 'sequelize';
import { Certification } from './certification.model';
import { CertificationFilter } from './inputs/certifications-filter.input';
import { CreateCertificationInput } from './inputs/create-certification.input';
import { UserCourseProgress } from '@src/course/interfaces/course.type';
import { DiplomaCourses } from '@src/diploma/models/diploma-course.model';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { DigitalOceanSpacesService } from '@src/_common/digitalocean/services/spaces.service';
import { CertificationType } from './certifications.type';
import { en } from '@faker-js/faker';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  NotificationParentTypeEnum,
  NotificationTypeEnum
} from '@src/notification/notification.enum';
import { CourseDetail } from '@src/course/models/course-detail.model';

@Injectable()
export class CertificationService {
  constructor(
    @Inject(Repositories.CertificationsRepository)
    private readonly certificationRepo: IRepository<Certification>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomasRepo: IRepository<Diploma>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly userAssignedCoursesRepo: IRepository<UsersAssignment>,
    @Inject(Repositories.DiplomaCoursesRepository)
    private readonly diplomaCoursesRepo: IRepository<DiplomaCourses>,
    @Inject(Repositories.CourseDetailsRepository)
    private readonly courseDetailsRepo: IRepository<CourseDetail>,
    private readonly pdfService: PdfService,
    // private readonly s3Service: S3Service,
    private readonly digitalOceanService: DigitalOceanSpacesService,
    private readonly userService: UserService,
    @InjectQueue('pusher') private readonly pusherQueue: Queue
  ) {}

  async createCertification(
    input: CreateCertificationInput
    // currentUser: User
  ): Promise<Certification> {
    const userId = input.userId;
    const user = await this.userRepo.findOne({
      id: userId,
      isDeleted: false,
      isBlocked: false
    });
    if (!user) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    //if the certification exist ?
    const existedCertification = await this.certificationRepo.findOne({
      userId,
      learningProgramId: input.learningProgramId,
      learningProgramType: input.learningProgramType
    });
    if (existedCertification) {
      throw new BaseHttpException(ErrorCodeEnum.CERTIFICATION_ALREADY_EXISTS);
    }
    //-------------------- if course ? --------------------
    if (
      input.learningProgramType === UpperCaseLearningProgramTypeEnum.COURSE ||
      input.learningProgramType === UpperCaseLearningProgramTypeEnum.WORKSHOP
    ) {
      // if course exist ?
      const course = await this.courseRepo.findOne(
        { id: input.learningProgramId, type: input.learningProgramType },
        [
          {
            model: CourseLecturer,
            include: [{ model: Lecturer, include: [{ model: User }] }]
          }
        ]
      );
      if (!course)
        throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);

      // if user is assigned to this course ?
      const userAssignedCourse = await this.userAssignedCoursesRepo.findOne({
        userId,
        courseId: input.learningProgramId
      });
      if (!userAssignedCourse) {
        throw new BaseHttpException(ErrorCodeEnum.USER_NOT_ASSIGNED_TO_COURSE);
      }

      //if the user has completed the course ?
      const { completedLessons, totalLessons } =
        await this.userService.getUserCourseProgress(user.id, course.id);
      if (completedLessons !== totalLessons) {
        return;
      }

      // create the new certificate
      let certification = await this.certificationRepo.createOne({
        userId,
        learningProgramId: input.learningProgramId,
        learningProgramType: input.learningProgramType,
        user,
        certificationType: CertificationType.LEIAQA,
        enUserName: input.enName,
        arUserName: input.arName,
        serialNumber: await this.generateSerialNumber(
          course,
          user,
          CertificationType.LEIAQA
        )
      });

      //generate the certificate pdf
      await this.generateCertification(
        certification,
        course,
        input.learningProgramType,
        user,
        input.enName,
        input.arName,
        CertificationType.LEIAQA
      );

      // if course has extra certifications
      await this.checkForExtraCertifications(
        course,
        input.learningProgramType,
        user,
        input.enName,
        input.arName
      );

      // check if the the user has completed the diplomas which have this course , if it is true then create the diploma certification
      await this.checkIfTheDiplomaIsCompleted(
        course.id,
        userId,
        input.enName,
        input.arName
      );

      return certification;
    }
    //-------------------- if Diploma ? --------------------
    else if (
      input.learningProgramType === UpperCaseLearningProgramTypeEnum.DIPLOMA
    ) {
      // if diploma exist ?
      const diploma = await this.diplomasRepo.findOne(
        { id: input.learningProgramId },
        [
          {
            model: Course,
            include: [
              {
                model: CourseLecturer,
                include: [{ model: Lecturer, include: [{ model: User }] }]
              }
            ]
          }
        ]
      );
      if (!diploma) {
        throw new BaseHttpException(ErrorCodeEnum.DIPLOMA_DOESNT_EXIST);
      }

      // if user is assigned to this diploma ?
      const userAssignedDiploma = await this.userAssignedCoursesRepo.findOne({
        userId,
        diplomaId: input.learningProgramId
      });
      if (!userAssignedDiploma) {
        throw new BaseHttpException(
          ErrorCodeEnum.USER_NOT_ENROLLED_TO_THIS_DIPLOMA
        );
      }

      //if the user has completed the Diploma ?
      const { completedLessons, totalLessons } =
        await this.getUserCompletedLessonsForDiploma(
          input.learningProgramId,
          userId
        );
      if (completedLessons !== totalLessons) {
        return;
      }

      //create the new certificate
      const diplomaCertification = await this.certificationRepo.createOne({
        userId,
        learningProgramId: input.learningProgramId,
        learningProgramType: input.learningProgramType,
        user: user,
        // serialNumber: diploma.id.slice(-10) + user.id.slice(-10),
        certificationType: CertificationType.LEIAQA,
        enUserName: input.enName,
        arUserName: input.arName,
        serialNumber: await this.generateSerialNumber(
          diploma,
          user,
          CertificationType.LEIAQA
        )
      });

      //create the certificate pdf
      await this.generateCertification(
        diplomaCertification,
        diploma,
        UpperCaseLearningProgramTypeEnum.DIPLOMA,
        user,
        input.enName,
        input.arName,
        CertificationType.LEIAQA
      );

      return diplomaCertification;
    }
  }

  // async createCertificationsForUser(user: User): Promise<void> {
  //   const courses = await this.userAssignedCoursesRepo.findAll({
  //     userId: user.id,
  //     completed: true
  //   });

  //   for (const course of courses) {
  //     const courseData = await this.courseRepo.findOne(
  //       { id: course.courseId },
  //       [],
  //       [],
  //       ['type']
  //     );
  //     await this.createCertification({
  //       userId: user.id,
  //       learningProgramId: course.courseId,
  //       learningProgramType:
  //         courseData.type === CourseTypeEnum.COURSE ?
  //           UpperCaseLearningProgramTypeEnum.COURSE
  //         : UpperCaseLearningProgramTypeEnum.WORKSHOP,
  //     });
  //   }
  // }

  async generateCertification(
    certification: Certification,
    learningProgram: Course | Diploma,
    learningProgramType: UpperCaseLearningProgramTypeEnum,
    user: User,
    enName: string,
    arName: string,
    certificationType: CertificationType = CertificationType.LEIAQA
  ): Promise<void> {
    // check if ACE data should exist
    const isAceCourse =
      (learningProgramType === UpperCaseLearningProgramTypeEnum.COURSE ||
        learningProgramType === UpperCaseLearningProgramTypeEnum.WORKSHOP) &&
      (learningProgram as Course)?.ACE_Certificate;

    // ACE fields
    const aceApprovedCourseNumber =
      isAceCourse ?
        ((learningProgram as Course)?.courseDetail?.aceApprovedCourseNumber ??
        null)
      : null;
    const aceCecsAwarded =
      isAceCourse ?
        ((learningProgram as Course)?.courseDetail?.aceCecsAwarded ?? null)
      : null;
    const acePresenterName =
      isAceCourse ?
        ((learningProgram as Course)?.courseDetail?.acePresentName ?? null)
      : null;

    const isLive =
      learningProgramType !== UpperCaseLearningProgramTypeEnum.DIPLOMA &&
      (learningProgram as Course)?.isLiveCourse;
    // EN certificate
    this.pdfService.createCertificate({
      certificateData: {
        certificateDate: String(
          certification.createdAt.toLocaleDateString('en-GB')
        ), // date
        courseDuration: this.formatDurationEnglish(
          learningProgram?.learningTime,
          learningProgram?.learningTimeUnit
        ),
        courseTitle: learningProgram.enTitle ?? null, // course title
        fullName: enName ?? null, // user name
        lecturerName:
          learningProgramType === UpperCaseLearningProgramTypeEnum.DIPLOMA ?
            null
          : acePresenterName, // presenter name

        providerName: 'LEIAQA', // provider name
        certificateNumber: certification.serialNumber, // serial number
        certificateUrl: `${process.env.WEBSITE_URL}/certification/${certification.id}`,
        aceApprovedCourseNumber, // ace approved
        aceCecsAwarded // ace cecs awards
      },
      lang: CertificateLang.EN,
      learningProgramType,
      learningProgramId: learningProgram.id,
      userId: user.id,
      userCode: user.code, // user code
      certificationId: certification.id,
      certificationType,
      isCertified:
        (learningProgram.type === CourseTypeEnum.COURSE ||
          learningProgram.type === CourseTypeEnum.WORKSHOP) &&
        learningProgram.ACE_Certificate,
      isLive
    });

    // AR certificate
    if (certificationType === CertificationType.LEIAQA) {
      this.pdfService.createCertificate({
        certificateData: {
          certificateDate: String(
            certification.createdAt.toLocaleDateString('ar-EG')
          ),
          courseDuration: this.formatDurationArabic(
            learningProgram?.learningTime,
            learningProgram?.learningTimeUnit
          ),
          courseTitle: learningProgram.arTitle ?? null,
          fullName: arName ?? null,
          lecturerName:
            learningProgramType === UpperCaseLearningProgramTypeEnum.DIPLOMA ?
              null
            : acePresenterName,
          providerName: 'LEIAQA',
          certificateNumber: certification.serialNumber,
          certificateUrl: `${process.env.WEBSITE_URL}/certification/${certification.id}`,
          aceApprovedCourseNumber,
          aceCecsAwarded
        },
        lang: CertificateLang.AR,
        learningProgramType,
        learningProgramId: learningProgram.id,
        userId: user.id,
        userCode: user.code,
        certificationId: certification.id,
        certificationType,
        isCertified:
          (learningProgram.type === CourseTypeEnum.COURSE ||
            learningProgram.type === CourseTypeEnum.WORKSHOP) &&
          learningProgram.ACE_Certificate,
        isLive
      });
    }
  }

  //------
  async certifications(
    filter: CertificationFilter = {},
    sort?: SearchSortInput,
    paginator: NullablePaginatorInput = { paginate: { page: 1, limit: 15 } },
    currentUser?: User
  ): Promise<PaginationRes<Certification>> {
    const { userId, learningProgramId, myCertifications, learningProgramType } =
      filter || {};

    return await this.certificationRepo.findPaginated(
      {
        ...(userId && { userId }),
        ...(myCertifications && currentUser && { userId: currentUser?.id }),
        ...(learningProgramId && { learningProgramId }),
        ...(learningProgramType && { learningProgramType })
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
          model: User,
          as: 'user'
        },
        { model: Course }
      ]
    );
  }

  async myCertifications(
    currentUser: User,
    paginator: PaginatorInput
  ): Promise<PaginationRes<Certification>> {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.certificationRepo.findPaginated(
      {
        userId: currentUser.id
      },
      [[Sequelize.col('createdAt'), SortTypeEnum.DESC]],
      paginator?.page || 1,
      paginator?.limit || 12
      // [{ model: Course }]
    );
  }
  async certificationLearningProgram(
    id: string,
    type: UpperCaseLearningProgramTypeEnum
  ): Promise<Course | Diploma> {
    const programRepo =
      type === UpperCaseLearningProgramTypeEnum.DIPLOMA ?
        this.diplomasRepo
      : this.courseRepo;
    return await programRepo.findOne({ id });
  }

  async getCertificateByIdOrSerial(
    certificateId?: string,
    serialNumber?: string,
  ): Promise<Certification> {
    let certificate: Certification | null = null;

    if (certificateId) {
      certificate = await this.certificationRepo.findOne({ id: certificateId });
    } else if (serialNumber) {
      certificate = await this.certificationRepo.findOne({ serialNumber });
    }

    if (!certificate) {
      return null;
    }

    return certificate;
  }

  async getCertificatesForCourse(
    courseId: string,
    userId?: string
  ): Promise<Certification[]> {
    const certificates = await this.certificationRepo.findAll({
      learningProgramId: courseId,
      ...(userId && { userId })
    });

    if (!certificates || certificates.length === 0) {
      return [];
    }

    if (userId) {
      const unauthorized = certificates.some(cert => cert.userId !== userId);
      if (unauthorized) {
        throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);
      }
    }

    return certificates;
  }

  async deleteCertificateForUser(user: User): Promise<void> {
    const certificates = await this.certificationRepo.findAll({
      userId: user.id
    });

    for (const certificate of certificates) {
      await this.digitalOceanService.deleteFile(
        `certifications/${certificate.serialNumber}_en.pdf`
      );
      await this.digitalOceanService.deleteFile(
        `certifications/${certificate.serialNumber}_ar.pdf`
      );
      await this.digitalOceanService.deleteFile(
        `certifications/${certificate.serialNumber}_ar_preview.png`
      );
      await this.digitalOceanService.deleteFile(
        `certifications/${certificate.serialNumber}_en_preview.png`
      );
    }

    await this.certificationRepo.deleteAll({
      userId: user.id
    });
  }

  private formatDurationEnglish(time: number, unit: CourseTimeUnit): string {
    if (!time || !unit) return '';
    const unitLower = unit.toLowerCase();
    return time === 1 ? `${time} ${unitLower}` : `${time} ${unitLower}s`;
  }

  private formatDurationArabic(time: number, unit: CourseTimeUnit): string {
    if (!time || !unit) return '';
    const arabicUnits: Record<CourseTimeUnit, [string, string, string]> = {
      [CourseTimeUnit.HOUR]: ['ساعة', 'ساعتان', 'ساعات'],
      [CourseTimeUnit.MINUTE]: ['دقيقة', 'دقيقتان', 'دقائق'],
      [CourseTimeUnit.DAY]: ['يوم', 'يومان', 'أيام'],
      [CourseTimeUnit.WEEK]: ['أسبوع', 'أسبوعان', 'أسابيع'],
      [CourseTimeUnit.MONTH]: ['شهر', 'شهران', 'شهور']
    };

    const [singular, dual, plural] = arabicUnits[unit];

    if (time === 1) return singular;
    if (time === 2) return dual;
    return `${time} ${plural}`;
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

  async diplomaCoursesCertifications(
    diplomaId: string,
    userId: string
  ): Promise<Certification[]> {
    const diplomaCoursesIds = (
      await this.diplomaCoursesRepo.findAll({ diplomaId }, [], [], ['courseId'])
    ).map(dc => dc.courseId);
    const coursesCertifications: Certification[] =
      await this.certificationRepo.findAll({
        learningProgramId: diplomaCoursesIds,
        userId
      });

    return coursesCertifications;
  }

  async checkIfTheDiplomaIsCompleted(
    courseId: string,
    userId: string,
    enName: string,
    arName: string
  ): Promise<boolean> {
    // find diplomas with the same courseId and userId
    const diplomIds = (
      await this.userAssignedCoursesRepo.findAll(
        {
          courseId: courseId,
          userId: userId,
          diplomaId: { [Op.ne]: null }
        },
        [],
        [],
        ['diplomaId']
      )
    ).map(d => d.diplomaId);

    // if exist , then check if there is uncompletedCourse in this diploma
    if (diplomIds.length > 0) {
      diplomIds.map(async diplomId => {
        const uncompletedCourse = await this.userAssignedCoursesRepo.findOne({
          diplomaId: diplomId,
          userId: userId,
          completed: false
        });

        // if all courses are completed then create the diploma certification
        if (!uncompletedCourse) {
          // check if the user has already created the diploma certification
          const diplomaCertification = await this.certificationRepo.findOne({
            userId,
            learningProgramId: diplomId,
            learningProgramType: UpperCaseLearningProgramTypeEnum.DIPLOMA
          });
          if (diplomaCertification) {
            return true;
          } else {
            await this.createCertification({
              userId,
              learningProgramId: diplomId,
              learningProgramType: UpperCaseLearningProgramTypeEnum.DIPLOMA,
              enName,
              arName
            });
          }
        }
      });
    }
    return true;
  }
  async certificationsForSiteMap() {
    const certifications = await this.certificationRepo.findAll(
      {},
      [],
      [],
      ['id', 'updatedAt']
    );
    return certifications.map(c => {
      return { id: c.id, updatedAt: c.updatedAt };
    });
  }

  async checkForExtraCertifications(
    learningProgram: Course,
    learningProgramType: UpperCaseLearningProgramTypeEnum,
    user: User,
    enName: string,
    arName: string
  ): Promise<boolean> {
    if (learningProgram.ACE_Certificate) {
      console.log('has ace certificate');
      await this.createAceCertification(
        learningProgram,
        learningProgramType,
        user,
        enName,
        arName
      );
    }
    if (learningProgram.NASM_Certificate) {
      console.log('has nasm certificate');
    }
    if (learningProgram.LDISAUDI_Certificate) {
      console.log('has ldisaudi certificate');
    }
    return true;
  }

  async createAceCertification(
    learningProgram: Course,
    learningProgramType: UpperCaseLearningProgramTypeEnum,
    user: User,
    enName: string,
    arName: string
  ) {
    const course = await this.courseRepo.findOne(
      {
        id: learningProgram.id
      },
      [
        {
          model: CourseDetail
        }
      ]
    );
    const aceDays = course?.courseDetail?.aceDaysToGetCertified ?? 0;

    // create ace certification with pending = true
    const certification = await this.certificationRepo.createOne({
      userId: user.id,
      learningProgramId: course.id,
      learningProgramType,
      user,
      certificationType: CertificationType.ACE,
      pending: true,
      expectedCertificationDate: new Date(
        Date.now() + aceDays * 24 * 60 * 60 * 1000
      ),
      enUserName: enName,
      arUserName: arName,
      serialNumber: await this.generateSerialNumber(
        course,
        user,
        CertificationType.ACE
      )
    });

    // push notification that ace certification is pending
    await this.pusherQueue.add('pusher', {
      toUsers: [user.dataValues],
      notificationParentId: certification.id,
      notificationParentType: NotificationParentTypeEnum.CERTIFICATE,
      payloadData: {
        enTitle: `leiaqa`,
        arTitle: `لياقة`,
        enBody: `Congratulations on completing ${learningProgram.enTitle}! Your ACE accredited certificate will be available after ${aceDays} day(s).`,
        arBody: `تهانينا على إكمال ${learningProgram.arTitle}! ستصبح شهادتك المعتمدة من ACE متاحة بعد ${aceDays} يوم.`,
        url: `${process.env.WEBSITE_URL}/certification/${certification.id}`,
        type: NotificationTypeEnum.PROGRAM_COMPLETED_CERTIFICATE_AVAILABLE,
        notificationType:
          NotificationTypeEnum.PROGRAM_COMPLETED_CERTIFICATE_AVAILABLE,
        targetId: learningProgram.id
      }
    });
  }

  async generateSerialNumber(
    learningProgram: Course | Diploma,
    user: User,
    type: CertificationType
  ) {
    let slug = 'LQC';

    if (
      learningProgram instanceof Course &&
      learningProgram.ACE_Certificate === true &&
      type === CertificationType.ACE
    ) {
      const courseDetails = await this.courseDetailsRepo.findOne({
        courseId: learningProgram.id
      });
      if (courseDetails?.aceSlug) {
        slug = courseDetails.aceSlug;
      }
    }

    const programCode =
      learningProgram.code ? learningProgram.code.slice(2) : '';

    const userCode = user.code ? user.code.slice(2) : '';

    const serialNumber = `${slug}-${programCode}-${userCode}`;

    return serialNumber;
  }
}
