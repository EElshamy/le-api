import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Op } from 'sequelize';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { UsersAssignment } from '../models/user-assignments.model';
import { CourseService } from '../services/course.service';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { IRepository } from '@src/_common/database/repository.interface';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { LearningProgramInput } from '../inputs/learning-program.input';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@src/_common/mail/mail.service';
import { User } from '@src/user/models/user.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { IMailService } from '@src/_common/mail/mail.type';
import {
  NotificationParentTypeEnum,
  NotificationTypeEnum
} from '@src/notification/notification.enum';
import { DiplomaDetail } from '@src/diploma/models/diploma-detail.model';

@Injectable()
export class UserAssignmentsExpirationCron implements OnModuleInit {
  private readonly logger = new Logger(UserAssignmentsExpirationCron.name);

  constructor(
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly usersAssignmentsRepo: IRepository<UsersAssignment>,

    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>,

    @Inject(Repositories.DiplomasRepository)
    private readonly diplomaRepo: IRepository<Diploma>,

    @Inject(Repositories.DiplomaDetailsRepository)
    private readonly diplomaDetailsRepo: IRepository<DiplomaDetail>,

    private readonly courseService: CourseService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    @Inject(MailService) private readonly mailService: IMailService,
    @InjectQueue('pusher') private readonly pusherQueue: Queue
  ) {}

  onModuleInit() {
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'production';
    const cronExpression =
      nodeEnv === 'production' ? '0 4 * * *' : '*/2 * * * *';

    const job = new CronJob(cronExpression, async () => {
      await this.handleExpiredSubscriptions();
    });

    this.schedulerRegistry.addCronJob('user-assignments-expiration-cron', job);
    job.start();
  }

  async handleExpiredSubscriptions(): Promise<void> {
    const expiredAssignments = await this.usersAssignmentsRepo.findAll({
      accessExpiresAt: { [Op.lte]: new Date() }
    });

    if (!expiredAssignments.length) {
      return;
    }

    // Group by userId + diplomaId
    const grouped = new Map<
      string,
      {
        userId: string;
        diplomaId?: string;
        learningPrograms: LearningProgramInput[];
      }
    >();

    for (const assignment of expiredAssignments) {
      const key = `${assignment.userId}-${assignment.diplomaId ?? 'course'}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          userId: assignment.userId,
          diplomaId: assignment.diplomaId,
          learningPrograms: []
        });
      }
      grouped.get(key).learningPrograms.push({
        learningProgramId: assignment.courseId,
        learningProgramType: LearningProgramTypeEnum.COURSE
      });
    }

    for (const group of grouped.values()) {
      try {
        // send notifications
        await this.sendExpirationNotification(group.userId, group.diplomaId);

        // unassign user
        await this.courseService.unassignUserFromLearningProgram({
          userId: group.userId,
          diplomaId: group.diplomaId,
          learningPrograms: group.learningPrograms
        });
      } catch (error) {
        this.logger.error(
          `Failed to process expired user ${group.userId}`,
          error.stack
        );
      }
    }

    this.logger.log(`Expired subscriptions processed 🩷 : ${grouped.size}`);
  }

  // Send email + notification
  private async sendExpirationNotification(
    userId: string,
    diplomaId?: string
  ): Promise<void> {
    // Fetch valid user (exit early if not found)
    const user = await this.usersRepo.findOne(
      {
        id: userId,
        email: { [Op.ne]: null },
        isBlocked: false,
        isDeleted: false
      },
      undefined,
      undefined
    );

    if (!user || !diplomaId) return;

    const [diploma, diplomaDetails] = await Promise.all([
      this.diplomaRepo.findOne({ id: diplomaId }, undefined, undefined, [
        'id',
        'enTitle',
        'arTitle',
        'slug'
      ]),
      this.diplomaDetailsRepo.findOne({ diplomaId }, undefined, undefined, [
        'promoVideo'
      ])
    ]);

    if (!diploma) return;

    const subscriptionTitleEn = diploma.enTitle || 'the subscription';
    const subscriptionTitleAr = diploma.arTitle || 'الباقة';
    const url = `${process.env.WEBSITE_URL}/subscriptions/${diploma.slug}`;
    const videoId = diplomaDetails?.promoVideo ?? null;

    try {
      await Promise.all([
        this.mailService.send({
          to: user.email,
          template: 'subscription-expired',
          subject: 'Your Subscription Has Expired',
          templateData: {
            userName: user.firstName,
            diplomaName: subscriptionTitleEn,
            url
          }
        }),
        this.pusherQueue.add('pusher', {
          toUsers: [user.dataValues],
          notificationParentId: diploma.id,
          notificationParentType: NotificationParentTypeEnum.DIPLOMA,
          payloadData: {
            enTitle: 'Leiaqa',
            arTitle: 'لياقة',
            enBody: `Your access to ${subscriptionTitleEn} has expired. Renew now to continue learning.`,
            arBody: `انتهى اشتراكك في ${subscriptionTitleAr}. يمكنك التجديد الآن للمتابعة.`,
            url,
            videoId,
            type: NotificationTypeEnum.NEW_LEARNING_PROGRAM_AVAILABLE,
            notificationType:
              NotificationTypeEnum.NEW_LEARNING_PROGRAM_AVAILABLE,
            targetId: diploma.id,
            TargetType: NotificationParentTypeEnum.DIPLOMA,
            targetModel: NotificationParentTypeEnum.DIPLOMA,
            targetType: NotificationParentTypeEnum.DIPLOMA
          }
        })
      ]);
    } catch (err) {
      this.logger.error(
        `Failed to send email or notification for user ${userId}`,
        err.stack
      );
    }
  }
}
