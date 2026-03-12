import { SUPER_ADMIN_GROUP } from '../constants';
import { SendNotificationBoardInput } from './../../src/notification/inputs/send-notification-board.input';
import { SendNotificationBoardTypeEnum } from './../../src/notification/notification.enum';
import { NotificationPermissionsEnum } from './../../src/security-group/security-group-permissions';
import { SecurityGroupFactory } from './../../src/security-group/security-group.factory';
import { SecurityGroup } from './../../src/security-group/security-group.model';
import { UserFactory } from './../../src/user/factories/user.factory';
import { User } from './../../src/user/models/user.model';
import { UserRoleEnum } from './../../src/user/user.enum';

interface NotificationGenerateData {
  user?: User;
  overrideUser?: object;
  overrideSecurityGroup?: object;
  overrideInput?: object;
}
export async function generateNotificationData(
  overrideData: NotificationGenerateData = {}
) {
  const user = (await UserFactory(false, {
    isBlocked: false,
    role: UserRoleEnum.USER,
    ...(overrideData.overrideUser || {})
  })) as User;

  const patient = (await UserFactory(false, {
    isBlocked: false,
    role: UserRoleEnum.USER,
    ...(overrideData.overrideUser || {})
  })) as User;

  const adminRole = (await SecurityGroupFactory(false, {
    groupName: SUPER_ADMIN_GROUP,
    permissions: [NotificationPermissionsEnum.SEND_NOTIFICATIONS],
    ...(overrideData.overrideSecurityGroup || {})
  })) as SecurityGroup;

  const admin = (await UserFactory(false, {
    securityGroupId: adminRole.id,
    role: UserRoleEnum.USER
  })) as User;
  const input: SendNotificationBoardInput = {
    enTitle: 'enTitle',
    arTitle: 'arTitle',
    enBody: 'enBody',
    arBody: 'arBody',
    userType: SendNotificationBoardTypeEnum.ALL_USERS,
    ...(overrideData.overrideInput || {})
  };

  return { admin, user, patient, input };
}
