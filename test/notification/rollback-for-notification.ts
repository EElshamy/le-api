import { buildRepository } from './../../src/_common/database/database-repository.builder';
import { IRepository } from './../../src/_common/database/repository.interface';
import { Notification } from './../../src/notification/models/notification.model';
import { SecurityGroup } from './../../src/security-group/security-group.model';
import { User } from './../../src/user/models/user.model';

export async function rollbackDbForNotification() {
  const userRepo = new (buildRepository(User))() as IRepository<User>;
  const notificationRepo = new (buildRepository(
    Notification
  ))() as IRepository<Notification>;
  const securityGroupRepo = new (buildRepository(
    SecurityGroup
  ))() as IRepository<SecurityGroup>;

  await securityGroupRepo.rawDelete();
  await notificationRepo.rawDelete();
  await userRepo.rawDelete();
}
