import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { Notification } from './models/notification.model';
import { BoardNotification } from './models/baord-notifications.model';

export const GqlNotificationResponse = generateGqlResponseType(Notification);
export const GqlBoardNotificationResponse =
  generateGqlResponseType(BoardNotification);
export const GqlNotificationsResponse = generateGqlResponseType(
  Array(Notification)
);
export const GqlBoardNotificationsResponse = generateGqlResponseType(
  Array(BoardNotification)
);
export const GqlNotificationsNotPaginatedResponse = generateGqlResponseType(
  Array(Notification),
  true
);
export const GqlBoardNotificationsNotPaginatedResponse =
  generateGqlResponseType(Array(BoardNotification), true);
