import { CREATE_SECURITY_GROUP } from '../graphql/security-group';
import { post } from '../request';
import { ErrorCodeEnum } from './../../src/_common/exceptions/error-code.enum';
import { SecurityGroupPermissionsEnum } from './../../src/security-group/security-group-permissions';
import { SecurityGroupFactory } from './../../src/security-group/security-group.factory';
import { UserFactory } from './../../src/user/factories/user.factory';
import { rollbackDbForSecurityGroup } from './rollback-for-security-group';

describe('Create security group suite test', () => {
  afterEach(async () => {
    await rollbackDbForSecurityGroup();
  });

  it('return_error_if_not_authenticated', async () => {
    const securityGroup = await SecurityGroupFactory(true);

    const res = await post(CREATE_SECURITY_GROUP, {
      input: {
        groupName: securityGroup.groupName,
        description: securityGroup.description,
        permissions: securityGroup.permissions
      }
    });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_wrong_permission', async () => {
    const securityGroup = await SecurityGroupFactory(true);
    const securityGroupAdmin = await SecurityGroupFactory(false, {
      groupName: 'super admin',
      permissions: [SecurityGroupPermissionsEnum.READ_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroupAdmin.id
    });

    const res = await post(
      CREATE_SECURITY_GROUP,
      {
        input: {
          groupName: securityGroup.groupName,
          description: securityGroup.description,
          permissions: [SecurityGroupPermissionsEnum.READ_SECURITY_GROUPS]
        }
      },
      admin.token
    );

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_security_group_is_already_exist_with_same_name', async () => {
    const securityGroup = await SecurityGroupFactory(true);
    const securityGroupAdmin = await SecurityGroupFactory(false, {
      groupName: 'super admin',
      permissions: [SecurityGroupPermissionsEnum.CREATE_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroupAdmin.id
    });

    const res = await post(
      CREATE_SECURITY_GROUP,
      {
        input: {
          groupName: 'super admin',
          description: securityGroup.description,
          permissions: [SecurityGroupPermissionsEnum.READ_SECURITY_GROUPS]
        }
      },
      admin.token
    );

    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.SECURITY_GROUP_NAME_ALREADY_EXISTS
    );
  });

  it('create_security_group', async () => {
    const securityGroup = await SecurityGroupFactory(true);
    const securityGroupAdmin = await SecurityGroupFactory(false, {
      groupName: 'super admin',
      permissions: [SecurityGroupPermissionsEnum.CREATE_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroupAdmin.id
    });

    const res = await post(
      CREATE_SECURITY_GROUP,
      {
        input: {
          groupName: securityGroup.groupName,
          description: securityGroup.description,
          permissions: [SecurityGroupPermissionsEnum.READ_SECURITY_GROUPS]
        }
      },
      admin.token
    );

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.groupName).toEqual(
      securityGroup.groupName
    );
  });
});
