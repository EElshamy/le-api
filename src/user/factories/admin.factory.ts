import { SUPER_ADMIN_GROUP } from '../../../test/constants';
import { buildRepository } from '../../_common/database/database-repository.builder';
import { IRepository } from '../../_common/database/repository.interface';
import { getAllPermissions } from '../../security-group/security-group-permissions';
import { SecurityGroupFactory } from '../../security-group/security-group.factory';
import { SecurityGroup } from '../../security-group/security-group.model';
import { UserRoleEnum } from '../user.enum';
import { UserFactory } from './user.factory';

const securityGroupRepo = new (buildRepository(
  SecurityGroup
))() as IRepository<SecurityGroup>;

export async function AdminFactory(overridePermissions?: string[]) {
  let adminRole = await securityGroupRepo.findOne({
    groupName: SUPER_ADMIN_GROUP
  });
  if (!adminRole)
    adminRole = (await SecurityGroupFactory(false, {
      groupName: SUPER_ADMIN_GROUP,
      permissions: overridePermissions || getAllPermissions()
    })) as SecurityGroup;

  const admin = await UserFactory(
    false,
    {
      securityGroupId: adminRole.id,
      role: UserRoleEnum.ADMIN
    },
    true
  );

  return admin;
}
