import { Field, ObjectType } from '@nestjs/graphql';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { User } from '@src/user/models/user.model';
import {
  NotificationParentTypeEnum,
  NotificationTypeEnum
} from './notification.enum';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { DiplomaTypeEnum } from '@src/diploma/enums/diploma-type.enum';

export const NotificationTypeReturnedToUser = [];

export type AllowedUserFields = {
  id: string;
  fullName: string;
  // slug: string;
  profilePicture: string;
};

export type FcmTokensAndTokensLocalized = {
  AR: { ids: { receiverId: string; seen: false }[]; tokens: string[] };
  EN: { ids: { receiverId: string; seen: false }[]; tokens: string[] };
};

export type NotificationPayload = {
  enTitle?: string;
  arTitle?: string;
  enBody: string;
  arBody: string;
  notificationType: NotificationTypeEnum;
  thumbnail?: string;
  clickAction?: string;
  targetId?: string;
  targetModel?: LearningProgramTypeEnum;
  videoId?: string;
  details?: object;
  url ?: string
};

export type SaveNotificationForPusher = {
  refinedFromUser?: AllowedUserFields;
  notificationParentId?: string;
  notificationParentType?: NotificationParentTypeEnum;
  payloadData: NotificationPayload;
  messagingResponse?: any;
  toUsersIds: string[];
};

@ObjectType()
export class NotificationManager {
  @Field()
  VIA_PUSH: boolean;
}

@ObjectType()
export class NotificationReceiver {
  @Field(() => User)
  receiver: User;

  @Field(() => Timestamp, { nullable: true })
  seenAt: Timestamp | number;
}
@ObjectType()
export class NotificationParent {
  @Field({ nullable: true })
  id: string;

  @Field()
  videoId?: string;
}
@ObjectType()
export class NotExistRecord {
  @Field()
  notExistRecord: boolean;
}

export interface SiteNotificationsInput {
  userId: string;
  url?: string;
  programId?: string;
  diplomaId?: string;
  programArTitle?: string;
  programEnTitle?: string;
  diplomaArTitle?: string;
  diplomaEnTitle?: string;
  diplomaType?: DiplomaTypeEnum;
  arPostTitle?: string;
  enPostTitle?: string;
  postId?: string;
  walletId?: string;
}

export type SiteNotificationData = {
  arContent: string;
  enContent: string;
  url: string;
};
