import { Injectable, Scope, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Subscription
} from '@nestjs/graphql';
import { GqlBooleanResponse } from '@src/_common/graphql/graphql-response.type';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { AuthGuard } from '@src/auth/auth.guard';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { NotificationPermissionsEnum } from '@src/security-group/security-group-permissions';
import { User } from '@src/user/models/user.model';
import { IDataLoaders } from '../_common/dataloader/dataloader.interface';
import {
  BoardNotificationSortArgs,
  NullableFilterNotificationsInput
} from './inputs/filter-notifications.input';
import { SetNotificationsInSeenStatusInput } from './inputs/set-notifications-in-seen-status.input';
import { Notification } from './models/notification.model';
import {
  GqlBoardNotificationResponse,
  GqlBoardNotificationsResponse,
  GqlNotificationResponse,
  GqlNotificationsResponse
} from './notification-response.type';
import { NotificationService } from './notification.service';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import {
  createBoardNotificationInput,
  UpdateBoardNotificationInput
} from './inputs/create-board-notification.input';
import { UserRoleEnum } from '@src/user/user.enum';
import { BoardNotification } from './models/baord-notifications.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Course } from '@src/course/models/course.model';
import { NotificationReceiver } from './notification.type';

@Injectable({ scope: Scope.DEFAULT })
@Resolver(() => Notification)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  //** --------------------- QUERIES --------------------- */

  @Query(() => GqlNotificationsResponse)
  async notifications(
    @Args() filter: NullableFilterNotificationsInput,
    @Args() paginate: NullablePaginatorInput,
    @CurrentUser() currentUser: User
  ) {
    return await this.notificationService.notifications(
      filter.filter,
      paginate.paginate,
      currentUser
    );
  }

  @Query(() => GqlNotificationResponse)
  async notification(@Args('notificationId') notificationId: string) {
    return await this.notificationService.notification(notificationId);
  }

  @Query(() => GqlBooleanResponse)
  async setNotificationsInSeenStatus(
    @Args('input') input: SetNotificationsInSeenStatusInput
  ) {
    return await this.notificationService.setNotificationsInSeenStatus(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlNotificationsResponse)
  async mySiteNotifications(
    @CurrentUser('id') userId: string,
    @Args() paginator?: NullablePaginatorInput
  ) {
    return await this.notificationService.siteNotifications(
      userId,
      paginator.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlBoardNotificationsResponse)
  async boardNotifications(
    @Args() filter: NullableFilterNotificationsInput,
    @Args() paginate: NullablePaginatorInput,
    @Args({ type: () => BoardNotificationSortArgs })
    sort: BoardNotificationSortArgs
  ) {
    return await this.notificationService.boardNotifications(
      filter.filter,
      paginate?.paginate,
      sort?.sort
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlBoardNotificationResponse)
  async boardNotification(@Args('id') id: string) {
    return await this.notificationService.boardNotification(id);
  }

  @Subscription(() => Notification, {
    filter: (payload, variables) => {
      return payload?.newSiteNotification?.userId === variables.userId;
    },
    resolve: payload => {
      if (!payload?.newSiteNotification) {
        console.error('Received undefined payload in subscription');
        return null;
      }
      return payload?.newSiteNotification?.siteNotification;
    }
  })
  async subscribeToSiteNotifications(
    @Args('userId', { type: () => String, nullable: false }) userId: string
  ): Promise<any> {
    return this.notificationService.SubscribeTositeNotification();
  }

  //** --------------------- MUTATIONS --------------------- */
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlBoardNotificationResponse)
  async createBoardNotification(
    @Args('input') input: createBoardNotificationInput
  ) {
    return await this.notificationService.createBoardNotification(input);
  }
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlBoardNotificationResponse)
  async updateBoardNotification(
    @Args('input') input: UpdateBoardNotificationInput
  ) {
    return await this.notificationService.updateBoardNotification(input);
  }
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlBooleanResponse)
  async deleteBoardNotification(@Args('id') id: string) {
    return await this.notificationService.deleteBoardNotification(id);
  }

  @Mutation(() => GqlBooleanResponse)
  async deleteNotification(
    @Args('notificationId') notificationId: string,
    @CurrentUser() currentUser: User
  ): Promise<boolean> {
    return await this.notificationService.deleteNotification(
      notificationId,
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  async deleteNotifications(
    @CurrentUser() currentUser: User
  ): Promise<boolean> {
    return await this.notificationService.deleteNotifications(currentUser);
  }

  // @UseGuards(ValidUserGuard)
  // @Mutation(() => GqlUserResponse)
  // async managePatientNotifications(
  //   @Args('input') input: ManagePatientNotificationsInput
  // ) {
  //   return await this.notificationService.manageMyNotifications(input);
  // }

  // @UseGuards(ValidUserGuard)
  // @Mutation(() => GqlUserResponse)
  // async manageDoctorNotifications(
  //   @Args('input') input: ManageDoctorNotificationsInput
  // ) {
  //   return await this.notificationService.manageMyNotifications(input);
  // }

  @UseGuards(AuthGuard)
  @HasPermission(NotificationPermissionsEnum.SEND_NOTIFICATIONS)
  @Mutation(() => GqlBooleanResponse)
  async sendNotificationBoard(
    @Args('notificationId') id: string,
    @CurrentUser() currentUser: User
  ): Promise<boolean> {
    return await this.notificationService.sendNotificationBoardByNotificationId(
      id,
      currentUser
    );
  }

  //** ------------------ RESOLVE FIELDS ------------------ */

  @ResolveField(type => Timestamp)
  createdAt(@Parent() notification) {
    return new Date(notification.createdAt).valueOf();
  }

  // @ResolveField(() => Timestamp)
  // boardNotificationCreatedAt(@Parent() boardNotification: BoardNotification) {
  //   return boardNotification.createdAt.valueOf();
  // }

  @ResolveField(type => Timestamp)
  updatedAt(@Parent() notification) {
    return new Date(notification.updatedAt).valueOf();
  }

  @ResolveField(type => String, { nullable: true })
  localeTitle(
    @Context('currentUser') currentUser: User,
    @Parent() notification
  ) {
    const lang = currentUser?.favLang || 'EN';
    return notification[`${lang.toLowerCase()}Title`];
  }

  @ResolveField(type => String, { nullable: true })
  localeBody(
    @Context('currentUser') currentUser: User,
    @Parent() notification
  ) {
    const lang = currentUser?.favLang || 'EN';
    return notification[`${lang.toLowerCase()}Body`];
  }

  //** --------------------- DATALOADER --------------------- */

  // @ResolveField(type => NotificationParentUnion, { nullable: true })
  // parent(@Parent() notification, @Context('loaders') loaders: IDataLoaders) {
  //   if (!notification.parentId) return null;
  //   return loaders.notificationParentLoader.load(notification);
  // }
  @ResolveField(type => String, { nullable: true })
  async videoId(@Parent() notification: Notification): Promise<string> {
    if (!notification.targetId && !notification.targetModel) return null;
    return await this.notificationService.notificationVideoId(
      notification.targetId,
      notification.targetModel
    );
  }

  @ResolveField(type => User, { nullable: true })
  sender(
    @Parent() notification,
    @Context('loaders') loaders: IDataLoaders
  ): Promise<User> {
    if (!notification.senderId) return null;
    return loaders.userLoader.load(notification.senderId);
  }

  @ResolveField(type => [NotificationReceiver], { nullable: 'items' })
  receivers(
    @Parent() notification,
    @Context('loaders') loaders: IDataLoaders
  ): Promise<NotificationReceiver[]> {
    return loaders.notificationReceiversLoader.load(notification);
  }
}
