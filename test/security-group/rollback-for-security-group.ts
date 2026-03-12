import { buildRepository } from './../../src/_common/database/database-repository.builder';
import { IRepository } from './../../src/_common/database/repository.interface';
import { SecurityGroup } from './../../src/security-group/security-group.model';
import { User } from './../../src/user/models/user.model';

export async function rollbackDbForSecurityGroup() {
  const securityGroupRepo = new (buildRepository(
    SecurityGroup
  ))() as IRepository<SecurityGroup>;
  const userRepo = new (buildRepository(User))() as IRepository<User>;

  await securityGroupRepo.rawDelete();
  await userRepo.rawDelete();
}
