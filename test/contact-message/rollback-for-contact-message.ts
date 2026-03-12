import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { ContactMessage } from '@src/contact-message/contact-message.model';
import { SecurityGroup } from '@src/security-group/security-group.model';
import { User } from '@src/user/models/user.model';

export async function rollbackDbForContactMessage() {
  const securityGroupRepo = new (buildRepository(
    SecurityGroup
  ))() as IRepository<SecurityGroup>;
  const userRepo = new (buildRepository(User))() as IRepository<User>;
  const contactMessageRepo = new (buildRepository(
    ContactMessage
  ))() as IRepository<ContactMessage>;

  await securityGroupRepo.rawDelete();
  await contactMessageRepo.rawDelete();
  await userRepo.rawDelete();
}
