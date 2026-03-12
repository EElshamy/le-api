import { SEND_NOTIFICATION_BOARD } from '../graphql/notification';
import { post } from '../request';
import { buildRepository } from './../../src/_common/database/database-repository.builder';
import { IRepository } from './../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from './../../src/_common/exceptions/error-code.enum';
import { Notification } from './../../src/notification/models/notification.model';
import { SendNotificationBoardTypeEnum } from './../../src/notification/notification.enum';
import { UserPermissionsEnum } from './../../src/security-group/security-group-permissions';
import { UserFactory } from './../../src/user/factories/user.factory';
import { User } from './../../src/user/models/user.model';
import { UserRoleEnum } from './../../src/user/user.enum';
import { generateNotificationData } from './generate-notification-data';
import { rollbackDbForNotification } from './rollback-for-notification';

const notificationRepo = new (buildRepository(
  Notification
))() as IRepository<Notification>;

describe('Send notification board suite case', () => {
  afterEach(async () => {
    await rollbackDbForNotification();
  });
  it('return_error_if_not_authorized', async () => {
    const { input } = await generateNotificationData();
    const res = await post(SEND_NOTIFICATION_BOARD, { input });
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_wrong_permission', async () => {
    const { input, admin } = await generateNotificationData({
      overrideSecurityGroup: { permissions: [UserPermissionsEnum.CREATE_USERS] }
    });
    const res = await post(SEND_NOTIFICATION_BOARD, { input }, admin.token);
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('send_notification_to_all_users', async () => {
    const { input, admin } = await generateNotificationData();
    const res = await post(SEND_NOTIFICATION_BOARD, { input }, admin.token);
    expect(res.body.data.response.code).toBe(200);
    const notifications = await notificationRepo.findAll({}, [User]);
    expect(notifications.length).toBe(1);
    expect(notifications[0].receivers.length).toBe(2);
  });

  it('error_if_input_is_specific_users_and_not_users_ids_inputs', async () => {
    const { input, admin } = await generateNotificationData({
      overrideInput: { userType: SendNotificationBoardTypeEnum.SPECIFIC_USERS }
    });
    const res = await post(SEND_NOTIFICATION_BOARD, { input }, admin.token);
    expect(res.body.data.response.code).toBe(500);
  });

  it('send_notification_to_specific_users', async () => {
    const patient = await UserFactory(false, {
      role: UserRoleEnum.USER,
      isBlocked: true
    });
    const { input, admin } = await generateNotificationData({
      overrideInput: {
        userType: SendNotificationBoardTypeEnum.SPECIFIC_USERS,
        usersIds: [patient.id]
      }
    });
    const res = await post(SEND_NOTIFICATION_BOARD, { input }, admin.token);
    expect(res.body.data.response.code).toBe(200);
    const notifications = await notificationRepo.findAll({}, [User]);
    expect(notifications.length).toBe(1);
    expect(notifications[0].receivers.length).toBe(1);
  });
});
