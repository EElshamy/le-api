import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Notification } from '@src/notification/models/notification.model';
import {
  NotificationManagerEnum,
  NotificationParentTypeEnum,
  NotificationTypeEnum,
  PushNotificationEnum
} from '@src/notification/notification.enum';
import {
  AllowedUserFields,
  FcmTokensAndTokensLocalized,
  NotificationPayload,
  NotificationTypeReturnedToUser,
  SaveNotificationForPusher
} from '@src/notification/notification.type';
import { User } from '@src/user/models/user.model';
import { DeviceEnum, LangEnum } from '@src/user/user.enum';
import firebaseAdmin, { ServiceAccount } from 'firebase-admin';
import { PinoLogger } from 'nestjs-pino';
import { Sequelize } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { Repositories } from '../database/database-repository.enum';
import { IRepository } from '../database/repository.interface';
import { UserSession } from '@src/user-sessions/user-sessions.model';

@Injectable()
export class PusherService {
  constructor(
    @Inject(Repositories.NotificationsRepository)
    private readonly notificationRepo: IRepository<Notification>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(Repositories.UserSessionsRepository)
    private readonly userSessionsRepo: IRepository<UserSession>,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService
  ) {
    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')
        }),
        databaseURL: this.configService.get('FIREBASE_DB_URL')
      });
    }
    // console.log('firebase version', firebaseAdmin.SDK_VERSION);
  }

  private isUserAllowedToReceiveNotificationType(
    user: User,
    notificationType: NotificationTypeEnum
  ) {
    const attached = {
      [NotificationTypeEnum.NEW_CONTACT_MESSAGE]:
        user.notificationManager[
          NotificationManagerEnum.WHEN_NEW_CONTACT_MESSAGE
        ]
    };

    return attached[notificationType];
  }

  private getSpecificFieldsOfUsers(user: User): AllowedUserFields {
    return {
      id: user.id,
      fullName: user.enFullName || user.arFullName,
      // slug: user.slug,
      profilePicture: user.profilePicture
    };
  }

  private stringifyPayload(data: object): object {
    const newObj = {};
    Object.keys(data).map(key => {
      if (!Array.isArray(data[key])) {
        if (typeof data[key] === 'object') {
          newObj[key] = JSON.stringify(data[key]);
        } else newObj[key] = String(data[key]);
      }
    });
    return newObj;
  }

  private usersAllowedToReceiveNotifications(
    receivers: User[],
    notificationType: NotificationTypeEnum,
    fromUser?: User
  ): User[] {
    const whoReceiveNotifications = [];
    for (const receiver of receivers) {
      // Current user should not send notification to himself
      const isFromAndToUserSamePerson =
        fromUser ? fromUser.id === receiver.id : false;

      // `undefined` means notification type did not exist in notification manager
      if (
        // receiver.notificationManager.VIA_PUSH &&
        // [true, undefined].includes(
        //   this.isUserAllowedToReceiveNotificationType(
        //     receiver,
        //     notificationType
        //   )
        // ) &&
        !isFromAndToUserSamePerson
      )
        whoReceiveNotifications.push(receiver);
    }
    return whoReceiveNotifications;
  }

  private async executeProcess(
    arabicPayload: any[] = [],
    englishPayload: any[] = [],
    tokensAndIds: FcmTokensAndTokensLocalized,
    payloadData: NotificationPayload,
    refinedFromUser: AllowedUserFields = null,
    notificationParentId: string = null,
    notificationParentType: NotificationParentTypeEnum = null
  ): Promise<void> {
    // Save chucked responses
    const messagingResponse = { EN: [], AR: [], failedTokens: [] };
    const failedTokens = [];
    // console.log('payloadData', payloadData);

    // Send the arabic message
    if (arabicPayload && arabicPayload.length) {
      for (const arMsg of arabicPayload) {
        // console.log('arMsg', arMsg);

        const res =
          this.configService.get('NODE_ENV') !== 'testing' ?
            await firebaseAdmin.messaging().sendEachForMulticast(arMsg)
          : jest.fn().mockReturnValue({
              responses: arMsg.tokens.map((tk: string) => ({
                success: true,
                messageId: `${tk}__${Math.floor(Math.random() * 100000)}`
              })),
              successCount: arMsg.tokens.length,
              failureCount: 0
            })();
        messagingResponse.AR.push(res);
        if (res.failureCount > 0) {
          res.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const firstPartOfToken =
                tokensAndIds.AR.tokens[idx].split(':')[0];
              failedTokens.push(firstPartOfToken);
            }
          });
        }
      }
    }

    // Send the english message
    if (englishPayload && englishPayload.length) {
      for (const enMsg of englishPayload) {
        // console.log('enMsg', enMsg);
        let res;
        try {
          res =
            this.configService.get('NODE_ENV') !== 'testing' ?
              await firebaseAdmin.messaging().sendEachForMulticast(enMsg)
            : jest.fn().mockReturnValue({
                responses: enMsg.tokens.map((tk: string) => ({
                  success: true,
                  messageId: `${tk}__${Math.floor(Math.random() * 100000)}`
                })),
                successCount: enMsg.tokens.length,
                failureCount: 0
              })();
        } catch (error) {
          console.log('error', error);
        }

        messagingResponse.EN.push(res);
        if (res.failureCount > 0) {
          res.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const firstPartOfToken =
                tokensAndIds.EN.tokens[idx].split(':')[0];
              failedTokens.push(firstPartOfToken);
            }
          });
        }
      }
    }

    messagingResponse.failedTokens = failedTokens;
    await this.saveNotification({
      payloadData,
      toUsersIds: [...tokensAndIds.EN.ids, ...tokensAndIds.AR.ids].map(
        obj => obj.receiverId
      ),
      messagingResponse,
      notificationParentId,
      notificationParentType,
      refinedFromUser
    });
  }

  // private getReceiverTokensAndIds(
  //   receivers: User[],
  //   specificDevice?: DeviceEnum
  // ): FcmTokensAndTokensLocalized {
  //   return receivers.reduce(
  //     (total, user) => {
  //       const tokens =
  //         specificDevice ?
  //           [user.fcmTokens[specificDevice.toLocaleLowerCase()]]
  //         : Object.values(user.fcmTokens) || [];
  //       // const tokens = [];

  //       if (tokens) {
  //         total[user.favLang].tokens.push(...tokens.flat().filter(t => !!t));
  //         total[user.favLang].ids.push({ receiverId: user.id, seen: false });
  //       }
  //       return total;
  //     },
  //     { AR: { ids: [], tokens: [] }, EN: { ids: [], tokens: [] } }
  //   );
  // }

  private async getReceiverTokensAndIds(
    receivers: User[],
    specificDevice?: DeviceEnum
  ): Promise<FcmTokensAndTokensLocalized> {
    const total: FcmTokensAndTokensLocalized = {
      AR: { ids: [], tokens: [] },
      EN: { ids: [], tokens: [] }
    };

    for (const user of receivers) {

      // Get only active sessions from DB
      const activeSessions = await this.userSessionsRepo.findAll({
        userId: user.id,
        isActive: true
      });

      // Collect tokens
      let tokens: string[] = [];

      if (specificDevice) {
        // Pick token of specific device only
        const session = activeSessions.find(
          s => s.device.toLowerCase() === specificDevice.toLowerCase()
        );

        if (session?.fcmToken) tokens = [session.fcmToken];
      } else {
        // Collect all tokens from active sessions
        tokens = activeSessions.map(s => s.fcmToken).filter(t => !!t);
      }

      if (tokens.length) {
        total[user.favLang].tokens.push(...tokens);
        total[user.favLang].ids.push({ receiverId: user.id, seen: false });
      }
    }

    return total;
  }

  private setPayload(
    tokens: string[],
    data: NotificationPayload,
    lang: LangEnum = LangEnum.EN
  ) {
    const refinedData = JSON.parse(JSON.stringify(data));

    refinedData.notificationTitle = data[`${lang.toLowerCase()}Title`];
    refinedData.notificationBody = data[`${lang.toLowerCase()}Body`];
    refinedData.notificationType = data.notificationType;
    refinedData.localeTitle = data[`${lang.toLowerCase()}Title`];
    refinedData.localeBody = data[`${lang.toLowerCase()}Body`];
    refinedData.type = data.notificationType;
    delete refinedData.enTitle;
    delete refinedData.arTitle;
    delete refinedData.enBody;
    delete refinedData.arBody;
    // console.log('refinedData', refinedData);

    const chunkedMessages = [];
    for (let i = 0; i < tokens.length; i = i + 100) {
      const slicedTokens = tokens.slice(i, i + 100);
      chunkedMessages.push({
        tokens: slicedTokens,
        data: this.stringifyPayload(refinedData),
        android: {
          priority: 'high',
          ttl: 4 * 24 * 60 * 60 * 1000 // 4 days in milliseconds (number)
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-expiration': String(4 * 24 * 60 * 60 * 1000) // 4 days in milliseconds (string)
          },
          payload: {
            aps: {
              alert: {
                title: refinedData.notificationTitle,
                body: refinedData.notificationBody
              },
              contentAvailable: 1,
              mutableContent: true,
              sound: 'default'
            }
          }
        },
        webpush: {
          headers: {
            Urgency: 'high',
            TTL: String(4 * 24 * 60 * 60) // 4 days in sec (string)
          },
          notification: {
            clickAction:
              data.clickAction || this.configService.get('FRONT_BASE'),
            dir: lang === LangEnum.EN ? 'ltr' : 'rtl',
            icon: `${this.configService.get('API_BASE')}/default/logo.png`,
            title: refinedData.notificationTitle,
            body: refinedData.notificationBody
          }
        }
      });
    }
    return chunkedMessages;
  }

  public async push(
    toUsers: User[] = [],
    payloadData: NotificationPayload,
    fromUser: User = null,
    notificationParentId: string = null,
    notificationParentType: NotificationParentTypeEnum = null,
    scheduledTime: Date = null,
    specificDevice: DeviceEnum = null
  ): Promise<{ status: string }> {
    // console.log('payloadData', payloadData);
    // console.log('---------------------------------------------')
    const toUserReceivers = [];
    toUsers.map(toUserId => {
      if (!fromUser || fromUser.id !== toUserId.id)
        toUserReceivers.push(toUserId);
    });
    if (!payloadData.enTitle) payloadData.enTitle = process.env.APP_NAME;
    if (!payloadData.arTitle) payloadData.arTitle = process.env.APP_NAME;

    let refinedFromUser: AllowedUserFields = null;
    if (fromUser) refinedFromUser = this.getSpecificFieldsOfUsers(fromUser);

    toUsers = this.usersAllowedToReceiveNotifications(
      toUserReceivers,
      payloadData.notificationType,
      fromUser
    );
    if (!toUsers || !toUsers.length) {
      await this.saveNotification({
        payloadData,
        toUsersIds: toUsers.map(u => u.id),
        messagingResponse: {
          failed: true,
          reason: PushNotificationEnum.NO_USERS
        },
        notificationParentId,
        notificationParentType,
        refinedFromUser
      });
      return { status: PushNotificationEnum.NO_USERS };
    }

    // Separate users to generate arabic and english payload
    const tokensAndIds = await this.getReceiverTokensAndIds(
      toUsers,
      specificDevice
    );
    if (!tokensAndIds.AR.tokens.length && !tokensAndIds.EN.tokens.length) {
      await this.saveNotification({
        payloadData,
        toUsersIds: toUsers.map(u => u.id),
        messagingResponse: {
          failed: true,
          reason: PushNotificationEnum.NO_FCM_TOKENS
        },
        notificationParentId,
        notificationParentType,
        refinedFromUser
      });
      return { status: PushNotificationEnum.NO_FCM_TOKENS };
    }

    let arabicPayload = null;
    let englishPayload = null;

    if (tokensAndIds.AR.tokens.length)
      arabicPayload = this.setPayload(
        tokensAndIds.AR.tokens,
        payloadData,
        LangEnum.AR
      );
    if (tokensAndIds.EN.tokens.length)
      englishPayload = this.setPayload(
        tokensAndIds.EN.tokens,
        payloadData,
        LangEnum.EN
      );

    // TODO: Scheduled notifications

    await this.executeProcess(
      arabicPayload,
      englishPayload,
      tokensAndIds,
      payloadData,
      refinedFromUser,
      notificationParentId,
      notificationParentType
    );

    return {
      status: PushNotificationEnum.SUCCEED,
      ...payloadData.details
    };
  }

  async saveNotification(
    input: SaveNotificationForPusher
  ): Promise<Notification> {
    try {
      return await this.sequelize.transaction(async transaction => {
        const notification = await this.notificationRepo.createOne(
          {
            ...(input.refinedFromUser && {
              senderId: input.refinedFromUser.id
            }),
            ...(input.notificationParentId && {
              targetId: input.notificationParentId
            }),
            ...(input.notificationParentType && {
              targetModel: input.notificationParentType
            }),
            ...(input.payloadData.url && {
              url: input.payloadData.url
            }),
            type:
              input.payloadData.notificationType || NotificationTypeEnum.PUBLIC,
            enTitle: input.payloadData.enTitle,
            arTitle: input.payloadData.arTitle,
            enBody: input.payloadData.enBody,
            arBody: input.payloadData.arBody,
            thumbnail:
              input.payloadData.thumbnail ||
              `${this.configService.get('API_BASE')}/default/logo.png`,
            returnItToClient: NotificationTypeReturnedToUser.includes(
              input.payloadData.notificationType
            ),
            log: JSON.stringify(input.messagingResponse)
          },
          transaction
        );

        const users = await this.userRepo.findAll({ id: input.toUsersIds });
        await notification.$add('receivers', users, { transaction });
        // this.logger.warn(
        //   `**********************************************************
        //   CHECK NOTIFICATION ID IN DB: ${notification.id}
        //   **********************************************************`
        // );

        return notification;
      });
    } catch (error) {
      console.log('error', error);
    }
  }
}
