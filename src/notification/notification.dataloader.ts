import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { ContactMessage } from '@src/contact-message/models/contact-message.model';
import { SecurityGroup } from '@src/security-group/security-group.model';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { IDataLoaderService } from '../_common/dataloader/dataloader.interface';
import {
  NotificationDataLoaderType,
  NotificationParentLoaderType,
  NotificationReceiversLoaderType
} from '../_common/dataloader/dataloader.type';
import { NotificationUserStatus } from './models/notification-user-status.model';
import { Notification } from './models/notification.model';
import { NotificationTypeEnum } from './notification.enum';

@Injectable()
export class NotificationDataloader implements IDataLoaderService {
  constructor(
    @Inject(Repositories.NotificationUserStatusesRepository)
    private readonly notificationUserStatusRepo: IRepository<NotificationUserStatus>,
    @Inject(Repositories.SecurityGroupsRepository)
    private readonly securityGroupRepo: IRepository<SecurityGroup>,
    @Inject(Repositories.ContactMessagesRepository)
    private readonly contactRepo: IRepository<ContactMessage>
  ) {}

  createLoaders(currentUser: User): NotificationDataLoaderType {
    const notificationParentLoader: NotificationParentLoaderType =
      new DataLoader(
        async (notifications: any[]) =>
          await this.notificationParentLoader(notifications)
      );

    const notificationReceiversLoader: NotificationReceiversLoaderType =
      new DataLoader(async (notifications: Notification[]) => {
        if (!currentUser) return [];
        return await this.notificationReceiversLoader(
          notifications,
          currentUser
        );
      });
    return {
      notificationParentLoader,
      notificationReceiversLoader
    };
  }

  private overrideNotificationsWithMatchedParentInstances(
    parentInstances: any,
    parentsIds: string[],
    notifications: Notification[]
  ) {
    const parentIdsHaveNoInstancesInDb = Array.from(
      new Set(
        parentsIds.filter(
          parId => !parentInstances.map((p: any) => p.id).includes(parId)
        )
      )
    );
    parentIdsHaveNoInstancesInDb.map(p => {
      const matchedNotifications = notifications.filter(
        (n: Notification) => n.targetId === p
      );
      matchedNotifications.map((mn: Notification) => {
        const parentIndex = notifications.findIndex(
          (n: Notification) => n.id === mn.id
        );
        notifications[parentIndex] = { notExistRecord: true } as any;
      });
    });

    parentInstances.map((c: any) => {
      const matchedNotifications = notifications.filter(
        n => n.targetId === c.id
      );
      matchedNotifications.map(mn => {
        const parentIndex = notifications.findIndex(n => n.id === mn.id);
        notifications[parentIndex] = c;
      });
    });
  }

  private async notificationParentLoader(notifications) {
    const groupedNotificationsByType = notifications.reduce((total, not) => {
      if (!total[not.type]) total[not.type] = [{ parentId: not.parentId }];
      else total[not.type].push({ parentId: not.parentId });
      return total;
    }, {});

    const notificationTypes = Object.keys(
      groupedNotificationsByType
    ) as NotificationTypeEnum[];
    for (const type of notificationTypes) {
      if ([NotificationTypeEnum.NEW_CONTACT_MESSAGE].includes(type)) {
        const parentsIds = groupedNotificationsByType[type].reduce(
          (tot: string[], obj: Notification) => {
            tot.push(obj.targetId);
            return tot;
          },
          []
        );
        const contacts = await this.contactRepo.findAll({ id: parentsIds });
        this.overrideNotificationsWithMatchedParentInstances(
          contacts,
          parentsIds,
          notifications
        );
      }
    }
    return notifications;
  }

  private async notificationReceiversLoader(
    notifications: Notification[],
    currentUser?: User
  ) {
    const superAdminSecurityGroup = await this.securityGroupRepo.findOne({
      groupName: 'SuperAdmin'
    });

    // If current user was not the super admin, then receiver always will be the current user
    // If current user was the super admin, he can see all notifications receivers

    const notificationIds = notifications.map(notif => notif.id);
    const notificationUserStatuses =
      await this.notificationUserStatusRepo.findAll(
        { notificationId: { [Op.in]: notificationIds } },
        [User]
      );

    return notificationIds.map(id =>
      notificationUserStatuses
        .filter(nus => nus.notificationId === id)
        .reduce(
          (total, obj) => {
            total.push({
              seenAt: obj.seenAt ? obj.seenAt.valueOf() : null,
              receiver:
                (
                  !superAdminSecurityGroup ||
                  currentUser.securityGroupId !== superAdminSecurityGroup.id
                ) ?
                  currentUser
                : obj.receiver
            });
            return total;
          },
          <{ seenAt: number; receiver: User }[]>[]
        )
    );
  }
}
