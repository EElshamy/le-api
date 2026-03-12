import { NOT_EXISTED_UUID } from '../constants';
import { DELETE_SECURITY_GROUP } from '../graphql/security-group';
import { post } from '../request';
import { ErrorCodeEnum } from './../../src/_common/exceptions/error-code.enum';
import { SecurityGroupPermissionsEnum } from './../../src/security-group/security-group-permissions';
import { SecurityGroupFactory } from './../../src/security-group/security-group.factory';
import { UserFactory } from './../../src/user/factories/user.factory';
import { rollbackDbForSecurityGroup } from './rollback-for-security-group';

describe('Delete security group suite test', () => {
  afterEach(async () => {
    await rollbackDbForSecurityGroup();
  });

  it('return_error_if_not_authenticated', async () => {
    const securityGroup = await SecurityGroupFactory();
    const res = await post(DELETE_SECURITY_GROUP, {
      securityGroupId: securityGroup.id
    });
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_security_group_not_exist', async () => {
    const securityGroup = await SecurityGroupFactory(false, {
      permissions: [SecurityGroupPermissionsEnum.DELETE_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroup.id
    });
    const res = await post(
      DELETE_SECURITY_GROUP,
      { securityGroupId: NOT_EXISTED_UUID },
      admin.token
    );
    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.SECURITY_GROUP_DOES_NOT_EXIST
    );
  });

  it('return_error_if_wrong_permission', async () => {
    const securityGroup = await SecurityGroupFactory(false, {
      permissions: [SecurityGroupPermissionsEnum.READ_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroup.id
    });
    const res = await post(
      DELETE_SECURITY_GROUP,
      { securityGroupId: securityGroup.id },
      admin.token
    );
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('admin_should_not_delete_super_admin_group', async () => {
    const adminGroup = await SecurityGroupFactory(false, {
      permissions: [SecurityGroupPermissionsEnum.DELETE_SECURITY_GROUPS]
    });
    const superAdminGroup = await SecurityGroupFactory(false, {
      permissions: [SecurityGroupPermissionsEnum.DELETE_SECURITY_GROUPS],
      groupName: 'SuperAdmin'
    });
    const admin = await UserFactory(false, { securityGroupId: adminGroup.id });
    const res = await post(
      DELETE_SECURITY_GROUP,
      { securityGroupId: superAdminGroup.id },
      admin.token
    );
    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.CANT_DELETE_SUPER_ADMIN_GROUP
    );
  });

  it('delete_security_group', async () => {
    const securityGroup = await SecurityGroupFactory(false, {
      permissions: [SecurityGroupPermissionsEnum.DELETE_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroup.id
    });
    const res = await post(
      DELETE_SECURITY_GROUP,
      { securityGroupId: securityGroup.id },
      admin.token
    );
    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data).toBe(true);
  });
});
