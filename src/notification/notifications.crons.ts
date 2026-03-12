import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { Op } from 'sequelize';
import {
  NotificationParentTypeEnum,
  NotificationTypeEnum,
  SiteNotificationsTypeEnum
} from './notification.enum';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { NotificationService } from './notification.service';
import { IRepository } from '@src/_common/database/repository.interface';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { User } from '@src/user/models/user.model';
import { CourseDetail } from '@src/course/models/course-detail.model';
import { DiplomaDetail } from '@src/diploma/models/diploma-detail.model';
import { DiplomaTypeEnum } from '@src/diploma/enums/diploma-type.enum';

@Injectable()
export class NotificationsCrons {
  constructor(
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly usersAssignmentsRepo: IRepository<UsersAssignment>,
    @Inject(Repositories.CourseDetailsRepository)
    private readonly courseDetails: IRepository<CourseDetail>,
    @Inject(Repositories.DiplomaDetailsRepository)
    private readonly diplomaDetails: IRepository<DiplomaDetail>,
    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomasRepo: IRepository<Diploma>,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    private readonly notificationService: NotificationService,
    @InjectQueue('pusher') private readonly pusherQueue: Queue
  ) {}
  // send notifications to inactive lecturers who have not published a program in 2 months
  @Cron(CronExpression.EVERY_WEEK)
  async checkInactiveLecturers(): Promise<void> {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const inactiveLecturers: Lecturer[] = await this.lecturerRepo.findAll(
      {
        lastCourseCreatedAt: { [Op.lt]: twoMonthsAgo }
      },
      [],
      [],
      ['id', 'userId']
    );

    for (const lecturer of inactiveLecturers) {
      await this.notificationService.createSiteNotification(
        SiteNotificationsTypeEnum.ENCORAGEMENT_TO_PUBLISH_PROGRAM,
        {
          userId: lecturer.userId
        }
      );
    }
  }
  //send notifcations to inactive users who have not completed a program in 3 months
  @Cron(CronExpression.EVERY_WEEK)
  async checkInactiveUsers(): Promise<void> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // 1️) Get inactive assignments sorted oldest first
    const inactiveAssignments = (await this.usersAssignmentsRepo.findAll(
      {
        createdAt: { [Op.lt]: threeMonthsAgo },
        completed: false
      },
      [
        {
          model: Course,
          required: false,
          attributes: ['id', 'arTitle', 'enTitle', 'type', 'slug']
        }
      ],
      [['createdAt', 'ASC']]
    )) as UsersAssignment[];

    if (!inactiveAssignments.length) return;

    // 2️) Pick oldest assignment per user
    const userAssignmentMap = new Map<string, UsersAssignment>();

    for (const assignment of inactiveAssignments) {
      if (!userAssignmentMap.has(assignment.userId)) {
        userAssignmentMap.set(assignment.userId, assignment);
      }
    }

    const uniqueAssignments = Array.from(userAssignmentMap.values());

    // 3️) Collect IDs
    const userIds = uniqueAssignments.map(a => a.userId);

    const diplomaIds = uniqueAssignments
      .filter(a => !!a.diplomaId)
      .map(a => a.diplomaId!) as string[];

    const courseIds = uniqueAssignments
      .filter(a => !!a.courseId && !a.diplomaId)
      .map(a => a.courseId!) as string[];

    // 4️) Fetch related data (typed)
    const [users, diplomas, courseDetails, diplomaDetails] = await Promise.all([
      this.usersRepo.findAll({ id: userIds }) as Promise<User[]>,
      diplomaIds.length ?
        (this.diplomasRepo.findAll(
          { id: diplomaIds },
          [],
          [],
          ['id', 'arTitle', 'enTitle', 'slug', 'diplomaType']
        ) as Promise<Diploma[]>)
      : Promise.resolve([] as Diploma[]),
      courseIds.length ?
        (this.courseDetails.findAll(
          { courseId: courseIds },
          [],
          [],
          ['courseId', 'promoVideo']
        ) as Promise<any[]>)
      : Promise.resolve([]),
      diplomaIds.length ?
        (this.diplomaDetails.findAll(
          { diplomaId: diplomaIds },
          [],
          [],
          ['diplomaId', 'promoVideo']
        ) as Promise<any[]>)
      : Promise.resolve([])
    ]);

    // 5️) Typed Maps
    const usersMap = new Map<string, User>(
      users.map((u): [string, User] => [u.id, u])
    );

    const diplomaMap = new Map<string, Diploma>(
      diplomas.map((d): [string, Diploma] => [d.id, d])
    );

    const courseDetailsMap = new Map<string, any>(
      courseDetails.map((cd): [string, any] => [cd.courseId, cd])
    );

    const diplomaDetailsMap = new Map<string, any>(
      diplomaDetails.map((dd): [string, any] => [dd.diplomaId, dd])
    );

    // 6️) Send ONE notification per user
    for (const assignment of uniqueAssignments) {
      const user = usersMap.get(assignment.userId);
      if (!user) continue;

      // ======================
      // DIPLOMA
      // ======================
      if (assignment.diplomaId) {
        const diploma = diplomaMap.get(assignment.diplomaId);
        if (!diploma) continue;

        const details = diplomaDetailsMap.get(diploma.id);

        const basePath =
          diploma.diplomaType === DiplomaTypeEnum.SUBSCRIPTION ?
            'subscriptions'
          : 'paths';

        await this.pusherQueue.add('pusher', {
          toUsers: [user.dataValues],
          notificationParentId: diploma.id,
          notificationParentType: NotificationParentTypeEnum.DIPLOMA,
          payloadData: {
            enTitle: `Leiaqa`,
            arTitle: `لياقة`,
            enBody: `You’re making great progress! Keep going and complete ${diploma.enTitle} to unlock your certificate and level up your skills.`,
            arBody: `أنت تحقق تقدمًا رائعًا! استمر وأكمل ${diploma.arTitle} لفتح شهادتك ورفع مستواك.`,
            url: `${process.env.WEBSITE_URL}/${basePath}/${diploma.slug}`,
            type: NotificationTypeEnum.ENCORAGEMENT_TO_COMPLETE_PROGRAM,
            notificationType:
              NotificationTypeEnum.ENCORAGEMENT_TO_COMPLETE_PROGRAM,
            promoVideo: details?.promoVideo,
            targetId: diploma.id
          }
        });

        continue;
      }

      // ======================
      // COURSE
      // ======================
      const course = assignment.course;
      if (!course) continue;

      const details = courseDetailsMap.get(course.id);

      await this.pusherQueue.add('pusher', {
        toUsers: [user.dataValues],
        notificationParentId: course.id,
        notificationParentType: course.type,
        payloadData: {
          enTitle: `Leiaqa`,
          arTitle: `لياقة`,
          enBody: `You’re making great progress! Keep going and complete ${course.enTitle} to unlock your certificate and level up your skills.`,
          arBody: `أنت تحقق تقدمًا رائعًا! استمر وأكمل ${course.arTitle} لفتح شهادتك ورفع مستواك.`,
          url: `${process.env.WEBSITE_URL}/program/${course.slug}`,
          type: NotificationTypeEnum.ENCORAGEMENT_TO_COMPLETE_PROGRAM,
          notificationType:
            NotificationTypeEnum.ENCORAGEMENT_TO_COMPLETE_PROGRAM,
          promoVideo: details?.promoVideo,
          targetId: course.id
        }
      });
    }
  }
}
