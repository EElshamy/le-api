import { Inject, Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { GqlContext } from '@src/_common/graphql/graphql-context.type';
import {
  NullablePaginatorInput,
  PaginatorInput
} from '@src/_common/paginator/paginator.input';
import { PusherService } from '@src/_common/pusher/pusher.service';
import { User } from '@src/user/models/user.model';
import {
  BoardNotificationSortInput,
  FilterNotificationsInput
} from './inputs/filter-notifications.input';
import { SendNotificationBoardInput } from './inputs/send-notification-board.input';
import { SendNotificationInput } from './inputs/send-notification.input';
import { SetNotificationsInSeenStatusInput } from './inputs/set-notifications-in-seen-status.input';
import { NotificationUserStatus } from './models/notification-user-status.model';
import { Notification } from './models/notification.model';
import {
  BoardNotificationSortEnum,
  NotificationParentTypeEnum,
  NotificationTypeEnum,
  SendNotificationBoardTypeEnum,
  SiteNotificationsTypeEnum
} from './notification.enum';

import { Diploma } from '@src/diploma/models/diploma.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { Course } from '@src/course/models/course.model';
import { Wallet } from '@src/payment/models/wallet.model';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import sequelize, { Op, Sequelize } from 'sequelize';
import { OnEvent } from '@nestjs/event-emitter';
import {
  PAYOUT_WALLET_SUCCESS_EVENT,
  TRANSACTION_FULFILLED_EVENT
} from '@src/payment/constants/events-tokens.constants';
import { Transactional } from 'sequelize-transactional-typescript';
import {
  AssignUserToLearningProgramEvent,
  PayoutWalletSuccessEvent
} from '@src/course/interfaces/assign-user.interface';
import { WalletOwnerTypeEnum } from '@src/payment/enums/wallets.enums';
import {
  LearningProgramTypeEnum,
  UpperCaseLearningProgramTypeEnum
} from '@src/cart/enums/cart.enums';
import {
  SiteNotificationData,
  SiteNotificationsInput
} from './notification.type';
import {
  createBoardNotificationInput,
  UpdateBoardNotificationInput
} from './inputs/create-board-notification.input';
import { BoardNotification } from './models/baord-notifications.model';
import { CourseDetail } from '@src/course/models/course-detail.model';
import { DiplomaDetail } from '@src/diploma/models/diploma-detail.model';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Blog } from '@src/blogs/blog/models/blog.model';
import { BlogCategory } from '@src/blogs/blog-category/bLog-category.model';
import { DiplomaTypeEnum } from '@src/diploma/enums/diploma-type.enum';
@Injectable({
  scope: Scope.DEFAULT
})
export class NotificationService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(Repositories.NotificationsRepository)
    private readonly notificationRepo: IRepository<Notification>,
    @Inject(Repositories.BoardNotificationsRepository)
    private readonly boardNotificationsRepo: IRepository<BoardNotification>,
    @Inject(Repositories.NotificationUserStatusesRepository)
    private readonly notificationUserStatusRepo: IRepository<NotificationUserStatus>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    private readonly pusherService: PusherService,
    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomasRepo: IRepository<Diploma>,
    @Inject(Repositories.WalletsRepository)
    private readonly walletRepo: IRepository<Wallet>,
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly usersAssignmentsRepo: IRepository<UsersAssignment>,
    @Inject(Repositories.BlogsRepository)
    private readonly blogRepo: IRepository<Blog>,
    @Inject('PUB_SUB') private readonly pubSub: RedisPubSub,
    @InjectQueue('pusher') private readonly pusherQueue: Queue
  ) {}
  private readonly siteUrl = this.configService.get<string>('WEBSITE_URL');
  private readonly instructorUrl = 'https://instructor.leiaqa.com';

  async createBoardNotification(input: createBoardNotificationInput) {
    return await this.boardNotificationsRepo.createOne({
      ...input,
      arBody: input.arBody?.trim(),
      enBody: input.enBody?.trim(),
      enTitle: input.enTitle?.trim(),
      arTitle: input.arTitle?.trim()
    });
  }

  async updateBoardNotification(input: UpdateBoardNotificationInput) {
    const notification = await this.boardNotificationsRepo.findOne({
      id: input.id
    });
    if (!notification)
      throw new BaseHttpException(ErrorCodeEnum.NOTIFICATION_DOES_NOT_EXIST);
    return await this.boardNotificationsRepo.updateOneFromExistingModel(
      notification,
      input
    );
  }

  async deleteBoardNotification(id: string) {
    const notification = await this.boardNotificationsRepo.findOne({
      id: id
    });
    if (!notification)
      throw new BaseHttpException(ErrorCodeEnum.NOTIFICATION_DOES_NOT_EXIST);
    return await this.boardNotificationsRepo.deleteAll({ id });
  }
  async boardNotifications(
    filter: FilterNotificationsInput = {},
    paginate: PaginatorInput = {},
    sort: BoardNotificationSortInput = {
      sortBy: BoardNotificationSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    }
  ) {
    return await this.boardNotificationsRepo.findPaginated(
      {
        ...(filter?.searchKey && {
          [Op.or]: {
            arTitle: { [Op.iLike]: `%${filter.searchKey}%` },
            arBody: { [Op.iLike]: `%${filter.searchKey}%` },
            enTitle: { [Op.iLike]: `%${filter.searchKey}%` },
            enBody: { [Op.iLike]: `%${filter.searchKey}%` }
          }
        })
      },
      [[Sequelize.col(sort?.sortBy), sort?.sortType]],
      paginate.page || 0,
      paginate.limit || 15
    );
  }
  async boardNotification(id: string) {
    const notification = await this.boardNotificationsRepo.findOne({
      id: id
    });
    if (!notification)
      throw new BaseHttpException(ErrorCodeEnum.NOTIFICATION_DOES_NOT_EXIST);
    return notification;
  }
  async notifications(
    filter: FilterNotificationsInput = {},
    paginate: PaginatorInput = {},
    currentUser: User
  ) {
    const notifications = await this.notificationRepo.findPaginated(
      {
        returnItToClient: true
        // ...(filter.searchKey && {
        //   [Op.or]: {
        //     enTitle: { [Op.iLike]: `%${filter.searchKey}%` },
        //     arTitle: { [Op.iLike]: `%${filter.searchKey}%` },
        //     enBody: { [Op.iLike]: `%${filter.searchKey}%` },
        //     arBody: { [Op.iLike]: `%${filter.searchKey}%` }
        //   }
        // })
      },
      '-createdAt',
      paginate.page,
      paginate.limit
      // [
      //   {
      //     model: User,
      //     // where: { id: currentUser.id },// The same as `through` attribute
      //     attributes: ['id'],
      //     required: true,
      //     through: { where: { receiverId: currentUser.id } }
      //   }
      // ]
    );
    // const notificationIds = notifications.items.reduce((total, not) => {
    //   total.push(not.id);
    //   return total;
    // }, []);

    // // Set notification in seen status
    // await this.notificationUserStatusRepo.updateAll(
    //   { notificationId: { [Op.in]: notificationIds }, seenAt: null },
    //   { seenAt: new Date() }
    // );
    return notifications;
  }

  async notification(notificationId: string) {
    const notification = await this.notificationRepo.findOne({
      id: notificationId
    });

    if (!notification)
      throw new BaseHttpException(ErrorCodeEnum.NOTIFICATION_DOES_NOT_EXIST);

    return notification;
  }

  async setNotificationsInSeenStatus(input: SetNotificationsInSeenStatusInput) {
    await this.notificationUserStatusRepo.updateAll(
      { notificationId: { [Op.in]: input.notificationIds } },
      { seenAt: new Date() }
    );
    return true;
  }

  async sendNotification(
    input: SendNotificationInput,
    currentUser: User
  ): Promise<boolean> {
    const users = await this.userRepo.findAll({ id: input.usersIds });

    await this.pusherService.push(
      users,
      {
        arBody: input.arBody,
        enBody: input.enBody,
        enTitle: input.enTitle,
        arTitle: input.arTitle,
        notificationType: input.notificationType,
        thumbnail: `${this.configService.get('API_BASE')}/default/logo.png`
      },
      currentUser
    );
    return true;
  }

  async sendNotificationBoard(
    input: SendNotificationBoardInput,
    currentUser: User
  ): Promise<boolean> {
    // 1️. Get all target users (specific or all)
    let users = await this.userRepo.findAll({
      ...(input.userType === SendNotificationBoardTypeEnum.SPECIFIC_USERS && {
        id: input.usersIds
      })
    });

    // 2️. Filter users by device if provided
    if (input.device && input.device !== null) {
      users = users.filter(user => {
        const fcmTokens = user.fcmTokens || {};
        const tokens = fcmTokens[input.device.toLowerCase()];

        // Check if tokens exist and contain at least one valid entry
        return Array.isArray(tokens) && tokens.length > 0;
      });
    }

    // 3️. Push notification
    await this.pusherService.push(
      users,
      {
        arBody: input.arBody,
        enBody: input.enBody,
        enTitle: input.enTitle,
        arTitle: input.arTitle,
        notificationType: NotificationTypeEnum.PUBLIC,
        thumbnail: `${this.configService.get('API_BASE')}/default/logo.png`,
        details: {
          type: input.userType || null,
          userIds: input.usersIds || null
        }
      },
      currentUser,
      undefined,
      undefined,
      undefined,
      input.device
    );

    return true;
  }
  async sendNotificationBoardByNotificationId(
    notificationId: string,
    currentUser: User
  ): Promise<boolean> {
    const notification = await this.boardNotificationsRepo.findOne({
      id: notificationId
    });

    if (!notification) {
      throw new BaseHttpException(ErrorCodeEnum.NOTIFICATION_DOES_NOT_EXIST);
    }

    const payload = {
      arBody: notification.arBody,
      enBody: notification.enBody,
      enTitle: notification.enTitle,
      arTitle: notification.arTitle,
      notificationType: NotificationTypeEnum.PUBLIC,
      thumbnail: `${this.configService.get('API_BASE')}/default/logo.png`
    };

    let users: User[] = [];

    if (notification.device && notification.device !== null) {
      // Fetch only users who have an FCM token for the specified device (iOS or Android)
      users = await this.userRepo.findAll({
        isBlocked: false,
        isDeleted: false,
        email : { [Op.ne] : null }
      }
      );
      users = users.filter(
        user =>
          Array.isArray(user.fcmTokens?.[notification.device.toLowerCase()]) &&
          user.fcmTokens[notification.device.toLowerCase()].length > 0
      );
    } else {
      // If no specific device is provided, fetch all users
      users = await this.userRepo.findAll(
        {
          isBlocked: false,
          isDeleted: false,
          email : { [Op.ne] : null }
        }
      );
    }

    // Push notification to the selected users
    await this.pusherService.push(
      users,
      payload,
      currentUser,
      undefined,
      undefined,
      undefined,
      notification.device
    );

    // Increment the "timesSent" count for this notification
    await this.boardNotificationsRepo.updateOneFromExistingModel(notification, {
      timesSent: notification.timesSent + 1
    });

    return true;
  }

  async deleteNotification(notificationId: string, currentUser: User) {
    const notification = await this.notificationRepo.findOne({
      id: notificationId
    });
    if (!notification)
      throw new BaseHttpException(ErrorCodeEnum.NOTIFICATION_DOES_NOT_EXIST);

    const notificationUser = await this.notificationUserStatusRepo.findAll({
      notificationId: notification.id,
      receiverId: currentUser.id
    });
    if (!notificationUser)
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);

    await this.notificationRepo.deleteAll({ id: notificationId });

    return true;
  }

  async deleteNotifications(currentUser: User) {
    const notificationUsers = await this.notificationUserStatusRepo.findAll({
        receiverId: currentUser.id
      }),
      notificationIds = notificationUsers.map(n => n.notificationId);
    await this.notificationRepo.deleteAll({ id: { [Op.in]: notificationIds } });
    return true;
  }

  //! from tatmeen
  // async manageMyNotifications(
  //   input: ManagePatientNotificationsInput | ManageDoctorNotificationsInput
  // ): Promise<User> {
  //   const { currentUser } = this.context;
  //   let user = await this.userRepo.findOne({ id: currentUser.id });
  //   const patientInput = input as ManagePatientNotificationsInput;
  //   const doctorInput = input as ManageDoctorNotificationsInput;
  //   user = await this.userRepo.updateOneFromExistingModel(user, {
  //     notificationManager: {
  //       ...user.notificationManager,
  //       ...(patientInput.WHEN_APPOINTMENT_PRESCRIPTIONS_ADDED != undefined && {
  //         WHEN_APPOINTMENT_PRESCRIPTIONS_ADDED:
  //           patientInput.WHEN_APPOINTMENT_PRESCRIPTIONS_ADDED
  //       }),
  //       ...(input.VIA_PUSH != undefined && { VIA_PUSH: input.VIA_PUSH }),
  //       ...(patientInput.WHEN_APPOINTMENT_SICK_LEAVE_ADDED != undefined && {
  //         WHEN_APPOINTMENT_SICK_LEAVE_ADDED:
  //           patientInput.WHEN_APPOINTMENT_SICK_LEAVE_ADDED
  //       }),
  //       ...(patientInput.WHEN_APPOINTMENT_VISIT_SUMMARY_ADDED != undefined && {
  //         WHEN_APPOINTMENT_VISIT_SUMMARY_ADDED:
  //           patientInput.WHEN_APPOINTMENT_VISIT_SUMMARY_ADDED
  //       }),
  //       ...(patientInput.WHEN_APPOINTMENT_REPLIED != undefined && {
  //         WHEN_APPOINTMENT_REPLIED: patientInput.WHEN_APPOINTMENT_REPLIED
  //       }),
  //       ...(input.WHEN_SCHEDULED_APPOINTMENT_ALARM != undefined && {
  //         WHEN_SCHEDULED_APPOINTMENT_ALARM:
  //           input.WHEN_SCHEDULED_APPOINTMENT_ALARM
  //       }),
  //       ...(doctorInput.WHEN_APPOINTMENT_NEED_SUMMARY != undefined && {
  //         WHEN_APPOINTMENT_NEED_SUMMARY:
  //           doctorInput.WHEN_APPOINTMENT_NEED_SUMMARY
  //       }),
  //       ...(doctorInput.WHEN_APPOINTMENT_CANCELED != undefined && {
  //         WHEN_APPOINTMENT_CANCELED: doctorInput.WHEN_APPOINTMENT_CANCELED
  //       }),
  //       ...(doctorInput.WHEN_APPOINTMENT_REVIEWED != undefined && {
  //         WHEN_APPOINTMENT_REVIEWED: doctorInput.WHEN_APPOINTMENT_REVIEWED
  //       }),
  //       ...(doctorInput.WHEN_NEW_APPOINTMENT != undefined && {
  //         WHEN_NEW_APPOINTMENT: doctorInput.WHEN_NEW_APPOINTMENT
  //       }),
  //       ...(doctorInput.WHEN_APPOINTMENT_INCOME_ADDED_TO_DOCTOR_WALLET !=
  //         undefined && {
  //         WHEN_APPOINTMENT_INCOME_ADDED_TO_DOCTOR_WALLET:
  //           doctorInput.WHEN_APPOINTMENT_INCOME_ADDED_TO_DOCTOR_WALLET
  //       })
  //     }
  //   });
  //   return user;
  // }
  //site notifications
  async siteNotifications(
    userId: string,
    paginator?: PaginatorInput
  ): Promise<PaginationRes<Notification>> {
    const notifications = (
      await this.notificationUserStatusRepo.findAll(
        { receiverId: userId },
        [
          {
            model: Notification,
            as: 'notification'
          }
        ],
        [[sequelize.col('notification.createdAt'), SortTypeEnum.DESC]]
      )
    ).map(sn => sn.notificationId);
    const res = await this.notificationRepo.findPaginated(
      {
        id: {
          [Op.in]: notifications
        }
      },
      [['createdAt', SortTypeEnum.DESC]],
      paginator?.page || 1,
      paginator?.limit || 15
    );
    await this.markNotificationsAsSeen(res.items.map(n => n.id));
    return res;
  }
  async markNotificationsAsSeen(notificationIds: string[]) {
    await this.notificationRepo.updateAll(
      { id: [...notificationIds] },
      { seen: true }
    );
  }
  // this is the main method to create a site notification in other services
  async createSiteNotification(
    type: SiteNotificationsTypeEnum,
    data: SiteNotificationsInput
  ): Promise<void> {
    // check if the user exists
    const user = await this.usersRepo.findOne({ id: data.userId });
    if (!user) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    // handle the notification data based on the type of the notification
    const { arContent, enContent, url }: SiteNotificationData =
      await this.handleSiteNotificationData(type, data);
    // console.log(arContent, enContent, url);

    // create the site notification
    let siteNotification: Notification;
    try {
      siteNotification = await this.notificationRepo.createOne({
        type: NotificationTypeEnum.PUBLIC,
        arTitle: data.diplomaArTitle || data.programArTitle,
        enTitle: data.diplomaEnTitle || data.programEnTitle,
        arBody: arContent,
        enBody: enContent,
        url
      });
    } catch (error) {
      console.log(
        'debuggingggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg'
      );
      console.log(error);
    }

    if (!siteNotification || !siteNotification.id) {
      console.error('Failed to create site notification!');
      return;
    }

    // create the user site notification (junction table)
    await this.notificationUserStatusRepo.createOne({
      receiverId: data.userId,
      notificationId: siteNotification.id
    });

    // get the site notification to publish it to the user
    const userSiteNotification: NotificationUserStatus =
      await this.notificationUserStatusRepo.findOne(
        {
          receiverId: data.userId,
          notificationId: siteNotification.id
        },
        [
          {
            required: true,
            model: Notification
          }
        ]
      );

    if (!userSiteNotification) {
      console.error('User Site Notification not found!');
      return;
    }
    // console.log('userSiteNotification',userSiteNotification.siteNotification.createdAt);

    await this.pubSub.publish('newSiteNotification', {
      newSiteNotification: {
        userId: data.userId,
        siteNotification: userSiteNotification.notification
      }
    });
  }

  async handleSiteNotificationData(
    type: SiteNotificationsTypeEnum,
    data: SiteNotificationsInput
  ): Promise<SiteNotificationData> {
    let arContent: string, enContent: string, url: string;
    switch (type) {
      //--------------- LECTURER_APPROVAL ---------------
      case SiteNotificationsTypeEnum.LECTURER_APPROVAL: {
        enContent =
          'Welcome to Leiaqa! Start your journey and inspire learners.';
        arContent = 'مرحبًا بك في لياقة! ابدأ رحلتك وألهم المتعلمين';
        url = null;
        break;
      }
      //--------------- PUBLICATION_APPROVAL ---------------
      case SiteNotificationsTypeEnum.PUBLICATION_APPROVAL: {
        if (!data.programArTitle || !data.programEnTitle || !data.programId) {
          throw new BaseHttpException(
            ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          );
        }
        enContent = `Congratulations! Your ${data.programEnTitle} has been approved and is now live on Leiaqa.`;
        arContent = `تهانينا! تمت الموافقة على ${data.programArTitle} وأصبح متاحًا الآن على لياقة`;
        url = `${this.siteUrl}/program/${data.programId}`;
        break;
      }
      //--------------- PUBLICATION_REJECTION ---------------
      case SiteNotificationsTypeEnum.PUBLICATION_REJECTION: {
        if (!data.programArTitle || !data.programEnTitle) {
          throw new BaseHttpException(
            ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          );
        }
        enContent = `Your ${data.programEnTitle} was not approved. Please review the feedback in your email and make adjustments to resubmit.`;
        arContent = ` لم يتم الموافقة على ${data.programArTitle}. يرجى مراجعة الملاحظات في بريدك الإلكتروني وإجراء التعديلات لإعادة التقديم.`;
        url = `${this.instructorUrl}/courses?tab=submissions`;
        break;
      }
      //--------------- MONTHLY_PAYOUT_COMPLETED ---------------
      case SiteNotificationsTypeEnum.MONTHLY_PAYOUT_COMPLETED: {
        if (!data.walletId) {
          throw new BaseHttpException(
            ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          );
        }
        enContent = `Your monthly payout has been successfully processed. Check your account for details.`;
        arContent = `تم تحويل دفعتك الشهرية بنجاح! يُرجى التحقق من حسابك للاطلاع على التفاصيل`;
        url = `${this.instructorUrl}/transactions/payout/${data.walletId}`;
        break;
      }
      //--------------- CONTACT_US_TICKET_CONFIRMATION ---------------
      case SiteNotificationsTypeEnum.CONTACT_US_TICKET_CONFIRMATION: {
        enContent = `Your support ticket has been received. Our team will get back to you soon.`;
        arContent = ` تم استلام طلب الدعم الخاص بك. سيتواصل معك فريقنا قريبًا.`;
        url = null;
        break;
      }
      //--------------- ADDED_TO_DIPLOMA ---------------
      case SiteNotificationsTypeEnum.ADDED_TO_DIPLOMA: {
        if (
          !data.diplomaArTitle ||
          !data.diplomaEnTitle ||
          !data.programArTitle ||
          !data.programEnTitle ||
          !data.diplomaId
        ) {
          throw new BaseHttpException(
            ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          );
        }
        enContent = `Your ${data.programEnTitle} has been added to a diploma ${data.diplomaEnTitle}, increasing your reach and impact.`;
        arContent = `تم إضافة ${data.programArTitle} إلى دبلوم ${data.diplomaArTitle}، مما يزيد من وصولك وتأثيرك`;
        const basePath = this.getDiplomaBasePath(data.diplomaType);
        url = `${this.siteUrl}/${basePath}/${data.diplomaId}`;
        break;
      }
      //--------------- POST_PUBLISHED ---------------
      case SiteNotificationsTypeEnum.POST_PUBLISHED: {
        if (!data.arPostTitle || !data.enPostTitle || !data.postId) {
          throw new BaseHttpException(
            ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          );
        }
        const blog = await this.blogRepo.findOne({ id: data.postId }, [
          {
            model: BlogCategory
          }
        ]);
        const blogSlug = blog.slug;
        const blogCategorySlug = blog.category.slug;
        enContent = `Your ${data.enPostTitle} has been successfully published on Leiaqa. Keep inspiring learners!`;
        arContent = `تم نشر ${data.arPostTitle} بنجاح على لياقة استمر في إلهام المتعلمين`;
        // url = `${this.siteUrl}/blogs/${data.postId}`;
        url = `${this.siteUrl}/blogs/${blogCategorySlug}/${blogSlug}`;
        break;
      }
      //--------------- ENCORAGEMENT_TO_PUBLISH_PROGRAM ---------------
      case SiteNotificationsTypeEnum.ENCORAGEMENT_TO_PUBLISH_PROGRAM: {
        enContent = `It’s been a while since you last shared your knowledge! Keep inspiring learners by publishing a new course or workshop today. Your expertise is valuable—let’s make an impact together!`;
        arContent = `لقد مر وقت منذ أن شاركت معرفتك آخر مرة! استمر في إلهام المتعلمين من خلال نشر دورة جديدة أو ورشة عمل اليوم. خبرتك ثمينة - دعونا نحدث تأثيرًا معًا!`;
        url = `${this.instructorUrl}/courses/newCourse`;
        break;
      }
      //--------------- PURCHASE_CONFIRMATION ---------------
      case SiteNotificationsTypeEnum.PURCHASE_CONFIRMATION: {
        if (
          (!data.programArTitle || !data.programEnTitle) &&
          (!data.diplomaArTitle || !data.diplomaEnTitle)
        ) {
          throw new BaseHttpException(
            ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          );
        }
        enContent = `You've successfully enrolled in ${data.diplomaEnTitle ?? data.programEnTitle} on Leiaqa Start learning now!`;
        arContent = `لقد قمت بالتسجيل بنجاح في ${data.diplomaArTitle ?? data.programArTitle} على لياقة. ابدأ التعلم الآن`;
        url = `${this.siteUrl}/my-learning-programs`;
        break;
      }
      //--------------- SPECIAL_DISCOUNT_OFFER ---------------
      case SiteNotificationsTypeEnum.SPECIAL_DISCOUNT_OFFER: {
        if (
          (!data.programArTitle || !data.programEnTitle) &&
          (!data.diplomaArTitle || !data.diplomaEnTitle)
        ) {
          throw new BaseHttpException(
            ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          );
        }
        enContent = `We noticed you left ${data.diplomaEnTitle ?? data.programEnTitle} in your cart. Grab this exclusive discount before it’s gone!`;
        arContent = `لاحظنا أنك تركت ${data.diplomaArTitle ?? data.programArTitle} في سلة التسوق الخاصة بك. اغتنم هذا الخصم الحصري قبل أن ينتهي!`;
        url = `${this.siteUrl}/cart`;
        break;
      }
      //--------------- NEW_PROGRAM_AVAILABLE ---------------
      case SiteNotificationsTypeEnum.NEW_PROGRAM_AVAILABLE: {
        if (
          (!data.programArTitle || !data.programEnTitle) &&
          (!data.diplomaArTitle || !data.diplomaEnTitle)
        ) {
          throw new BaseHttpException(
            ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          );
        }
        if (!data.diplomaId && !data.programId) {
          throw new BaseHttpException(
            ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          );
        }
        enContent = `Explore our latest ${data.diplomaEnTitle ?? data.programEnTitle} programs and level up your skills today.`;
        arContent = `اكتشف أحدث ${data.diplomaArTitle ?? data.programArTitle} لدينا وطور مهاراتك اليوم`;
        if (data.diplomaId) {
          const basePath = this.getDiplomaBasePath(data.diplomaType);
          url = `${this.siteUrl}/${basePath}/${data.diplomaId}`;
        } else if (data.programId) {
          url = `${this.siteUrl}/program/${data.programId}`;
        }
        break;
      }
      //--------------- ENCORAGEMENT_TO_COMPLETE_PROGRAM ---------------
      case SiteNotificationsTypeEnum.ENCORAGEMENT_TO_COMPLETE_PROGRAM: {
        if (
          (!data.programArTitle || !data.programEnTitle) &&
          (!data.diplomaArTitle || !data.diplomaEnTitle)
        ) {
          throw new BaseHttpException(
            ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          );
        }
        if (!data.diplomaId && !data.programId) {
          throw new BaseHttpException(
            ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          );
        }
        enContent = `You’re making great progress! Keep going and complete ${data.diplomaEnTitle ?? data.programEnTitle} to unlock your certificate and level up your skills.`;
        arContent = ` أنت تحقق تقدمًا رائعًا! استمر وأكمل ${data.diplomaArTitle ?? data.programArTitle} لفتح شهادتك ورفع مستواك.`;
        if (data.diplomaId) {
          const basePath = this.getDiplomaBasePath(data.diplomaType);
          url = `${this.siteUrl}/${basePath}/${data.diplomaId}`;
        } else if (data.programId) {
          url = `${this.siteUrl}/program/${data.programId}`;
        }
        break;
      }
      //--------------- PROGRAM_COMPLETED_CERTIFICATE_AVAILABLE ---------------
      case SiteNotificationsTypeEnum.PROGRAM_COMPLETED_CERTIFICATE_AVAILABLE:
        {
          if (
            (!data.programArTitle || !data.programEnTitle) &&
            (!data.diplomaArTitle || !data.diplomaEnTitle)
          ) {
            throw new BaseHttpException(
              ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
            );
          }
          // if (!data.diplomaId && !data.programId) {
          //   throw new BaseHttpException(
          //     ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
          //   );
          // }
          enContent = `Congratulations on completing ${data.diplomaEnTitle ?? data.programEnTitle}! Your certificate is ready—download it and share your achievements with the world.`;
          arContent = `تهانينا على إكمال ${data.diplomaArTitle ?? data.programArTitle}! شهادتك جاهزة—قم بتنزيلها وشارك إنجازك مع العالم.`;
          url = `${this.siteUrl}/my-certificates`;
        }
        break;
      //--------------------- USER_ASSIGNED_TO_PROGRAM -------------------------
      case SiteNotificationsTypeEnum.USER_ASSIGNED_TO_PROGRAM:
        {
          if (
            (!data.programArTitle || !data.programEnTitle) &&
            (!data.diplomaArTitle || !data.diplomaEnTitle)
          ) {
            throw new BaseHttpException(
              ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
            );
          }
          if (!data.diplomaId && !data.programId) {
            throw new BaseHttpException(
              ErrorCodeEnum.MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS
            );
          }
          enContent = `Great news! The admin has assigned you to ${data.diplomaEnTitle ?? data.programEnTitle}. You can now access the course materials and start learning.`;
          arContent = `خبر رائع! تم إلحاقك بـ ${data.diplomaArTitle ?? data.programArTitle}. يمكنك الآن الوصول إلى محتويات الدورة والبدء في التعلم.`;
          if (data.diplomaId) {
            const basePath = this.getDiplomaBasePath(data.diplomaType);
            url = `${this.siteUrl}/${basePath}/${data.diplomaId}`;
          } else if (data.programId) {
            url = `${this.siteUrl}/program/${data.programId}`;
          }
        }
        break;
    }
    return { arContent, enContent, url };
  }

  SubscribeTositeNotification(): any {
    return this.pubSub.asyncIterator('newSiteNotification');
  }
  //################################# EVENTS #################################
  // send notification to lecturer when monthly payout completed
  @OnEvent(PAYOUT_WALLET_SUCCESS_EVENT, { async: true })
  @Transactional()
  async handleMonthlyPayoutCompletedNotification(
    event: PayoutWalletSuccessEvent
  ) {
    const wallet = await this.walletRepo.findOne({
      id: event.walletId
    });
    if (wallet.ownerType === WalletOwnerTypeEnum.LECTURER) {
      const lecturer = await this.lecturerRepo.findOne(
        {
          id: wallet.ownerId
        },
        [],
        [],
        ['userId']
      );

      await this.createSiteNotification(
        SiteNotificationsTypeEnum.MONTHLY_PAYOUT_COMPLETED,
        {
          userId: lecturer.userId,
          walletId: wallet.id
        }
      );
    }
  }

  //send notifications to the user to tell him that he was enrolled successfully in a program
  @OnEvent(TRANSACTION_FULFILLED_EVENT, { async: true })
  @Transactional()
  async handleTransactionFulfilledNotification(
    event: AssignUserToLearningProgramEvent
  ): Promise<void> {
    const user = await this.usersRepo.findOne({ id: event.userId });
    for (const learningProgram of event.learningPrograms) {
      if (
        learningProgram.learningProgramType ===
          LearningProgramTypeEnum.COURSE ||
        learningProgram.learningProgramType === LearningProgramTypeEnum.WORKSHOP
      ) {
        const course = await this.courseRepo.findOne(
          {
            id: learningProgram.learningProgramId
          },
          [],
          [],
          ['id', 'enTitle', 'arTitle', 'type']
        );
        // await this.createSiteNotification(
        //   SiteNotificationsTypeEnum.PURCHASE_CONFIRMATION,
        //   {
        //     userId: event.userId,
        //     programArTitle: course.arTitle,
        //     programEnTitle: course.enTitle
        //     // programId: learningProgram.learningProgramId
        //   }
        // );
        await this.pusherQueue.add('pusher', {
          toUsers: [user.dataValues],
          //targetId in DB
          notificationParentId: course.id,
          //targetModel in DB
          notificationParentType: course.type,
          payloadData: {
            enTitle: `Leiaqa`,
            arTitle: `لياقة`,
            enBody: `You've successfully enrolled in ${course.enTitle} on Leiaqa. Start learning now!`,
            arBody: `لقد قمت بالتسجيل بنجاح في ${course.arTitle} على لياقة. ابدأ التعلم الآن`,
            url: `${this.siteUrl}/my-learning-programs`,
            type: NotificationTypeEnum.PURCHASE_CONFIRMATION,
            //for type in DB
            notificationType: NotificationTypeEnum.PURCHASE_CONFIRMATION,
            targetId: course.id
            // targetModel: course.type,
            // TargetType: course.type
          }
        });
      } else if (
        learningProgram.learningProgramType === LearningProgramTypeEnum.DIPLOMA
      ) {
        const diploma = await this.diplomasRepo.findOne(
          {
            id: learningProgram.learningProgramId
          },
          [],
          [],
          ['id', 'enTitle', 'arTitle']
        );
        // await this.createSiteNotification(
        //   SiteNotificationsTypeEnum.PURCHASE_CONFIRMATION,
        //   {
        //     userId: event.userId,
        //     diplomaArTitle: diploma.arTitle,
        //     diplomaEnTitle: diploma.enTitle
        //     // diplomaId: learningProgram.learningProgramId
        //   }
        // );
        await this.pusherQueue.add('pusher', {
          toUsers: [user.dataValues],
          notificationParentId: diploma.id,
          notificationParentType: NotificationParentTypeEnum.DIPLOMA,
          payloadData: {
            enTitle: `Leiaqa`,
            arTitle: `لياقة`,
            enBody: `You've successfully enrolled in ${diploma.enTitle} on Leiaqa. Start learning now!`,
            arBody: `لقد قمت بالتسجيل بنجاح في ${diploma.arTitle} على لياقة. ابدأ التعلم الآن`,
            url: `${this.siteUrl}/my-learning-programs`,
            type: NotificationTypeEnum.PURCHASE_CONFIRMATION,
            notificationType: NotificationTypeEnum.PURCHASE_CONFIRMATION,
            targetId: diploma.id,
            targetType: NotificationParentTypeEnum.DIPLOMA,
            TargetType: NotificationParentTypeEnum.DIPLOMA,
            targetModel: NotificationParentTypeEnum.DIPLOMA
          }
        });
      }
    }
  }

  async notificationVideoId(
    // if the notification is about a course or diploma, return its promoVideoId
    parentId: string,
    parentType: NotificationParentTypeEnum
  ): Promise<string> {
    const { repo, join, field } =
      parentType === NotificationParentTypeEnum.COURSE ?
        {
          repo: this.courseRepo,
          join: { model: CourseDetail },
          field: 'courseDetail'
        }
      : parentType === NotificationParentTypeEnum.DIPLOMA ?
        {
          repo: this.diplomasRepo,
          join: { model: DiplomaDetail },
          field: 'diplomaDetail'
        }
      : { repo: null, join: null, field: null };
    if (!repo || !join || !field) return null;
    const parent = await repo.findOne(
      {
        id: parentId
      },
      [join],
      [],
      ['id']
    );

    return parent?.[field]?.promoVideo;
  }
  private getDiplomaBasePath(diplomaType?: DiplomaTypeEnum): string {
    return diplomaType === DiplomaTypeEnum.SUBSCRIPTION ?
        'subscriptions'
      : 'paths';
  }
}
