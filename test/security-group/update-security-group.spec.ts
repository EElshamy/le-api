import { NOT_EXISTED_UUID } from '../constants';
import { UPDATE_SECURITY_GROUP } from '../graphql/security-group';
import { post } from '../request';
import { ErrorCodeEnum } from './../../src/_common/exceptions/error-code.enum';
import { SecurityGroupPermissionsEnum } from './../../src/security-group/security-group-permissions';
import { SecurityGroupFactory } from './../../src/security-group/security-group.factory';
import { UserFactory } from './../../src/user/factories/user.factory';
import { rollbackDbForSecurityGroup } from './rollback-for-security-group';

describe('Update security group suite test', () => {
  afterEach(async () => {
    await rollbackDbForSecurityGroup();
  });

  it('return_error_if_not_authenticated', async () => {
    const securityGroup = await SecurityGroupFactory();

    const res = await post(UPDATE_SECURITY_GROUP, {
      input: { securityGroupId: securityGroup.id, groupName: 'updated' }
    });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_security_group_not_exist', async () => {
    const securityGroup = await SecurityGroupFactory(false, {
      permissions: [SecurityGroupPermissionsEnum.UPDATE_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroup.id
    });

    const res = await post(
      UPDATE_SECURITY_GROUP,
      { input: { securityGroupId: NOT_EXISTED_UUID, groupName: 'updated' } },
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
      UPDATE_SECURITY_GROUP,
      { input: { securityGroupId: NOT_EXISTED_UUID, groupName: 'updated' } },
      admin.token
    );

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_security_group_is_already_exist_with_same_name', async () => {
    const securityGroup = await SecurityGroupFactory();
    const securityGroupAdmin = await SecurityGroupFactory(false, {
      groupName: 'super admin',
      permissions: [SecurityGroupPermissionsEnum.UPDATE_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroupAdmin.id
    });

    const res = await post(
      UPDATE_SECURITY_GROUP,
      {
        input: { securityGroupId: securityGroup.id, groupName: 'super admin' }
      },
      admin.token
    );

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.SECURITY_GROUP_NAME_ALREADY_EXISTS
    );
  });

  it('update_security_group', async () => {
    const securityGroup = await SecurityGroupFactory(false, {
      permissions: [SecurityGroupPermissionsEnum.UPDATE_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroup.id
    });

    const res = await post(
      UPDATE_SECURITY_GROUP,
      { input: { securityGroupId: securityGroup.id, groupName: 'updated' } },
      admin.token
    );

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.groupName).toBe('updated');
  });
});
