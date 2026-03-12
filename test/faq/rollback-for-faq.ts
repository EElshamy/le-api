import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { Faq } from '@src/faq/models/faq.model';
import { SecurityGroup } from '@src/security-group/security-group.model';
import { User } from '@src/user/models/user.model';

export async function rollbackDbForFaqs() {
  const securityGroupRepo = new (buildRepository(
    SecurityGroup
  ))() as IRepository<SecurityGroup>;
  const userRepo = new (buildRepository(User))() as IRepository<User>;
  const faqRepo = new (buildRepository(Faq))() as IRepository<Faq>;

  await securityGroupRepo.rawDelete();
  await faqRepo.rawDelete();
  await userRepo.rawDelete();
}
