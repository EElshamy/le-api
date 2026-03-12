import { SUPER_ADMIN_GROUP } from '../constants';
import { UserPermissionsEnum } from './../../src/security-group/security-group-permissions';
import { SecurityGroupFactory } from './../../src/security-group/security-group.factory';
import { UserFactory } from './../../src/user/factories/user.factory';
import { UserRoleEnum } from './../../src/user/user.enum';

interface UsersGenerateData {
  overrideSecurityGroup?: object;
  overrideUser?: object;
}

export async function generateUserData(overrideData: UsersGenerateData = {}) {
  const securityGroup = await SecurityGroupFactory(false, {
    permissions: [UserPermissionsEnum.READ_USERS],
    groupName: SUPER_ADMIN_GROUP,
    ...(overrideData.overrideSecurityGroup || {})
  });
  const admin = await UserFactory(false, {
    securityGroupId: securityGroup.id,
    isBlocked: false,
    verifiedPhone: '+201099988877',
    role: UserRoleEnum.USER
  });
  const user = await UserFactory(false, {
    isBlocked: false,
    verifiedPhone: '+201099988879',
    role: UserRoleEnum.USER,
    ...(overrideData.overrideUser || {})
  });
  return { securityGroup, admin, user };
}
