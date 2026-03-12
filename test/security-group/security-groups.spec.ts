import { SECURITY_GROUPS } from '../graphql/security-group';
import { post } from '../request';
import { ErrorCodeEnum } from './../../src/_common/exceptions/error-code.enum';
import { SecurityGroupPermissionsEnum } from './../../src/security-group/security-group-permissions';
import {
  SecurityGroupFactory,
  SecurityGroupsFactory
} from './../../src/security-group/security-group.factory';
import { UserFactory } from './../../src/user/factories/user.factory';
import { rollbackDbForSecurityGroup } from './rollback-for-security-group';

describe('Security groups suite test', () => {
  afterEach(async () => {
    await rollbackDbForSecurityGroup();
  });

  it('return_error_if_not_authenticated', async () => {
    await SecurityGroupsFactory(5);

    const res = await post(SECURITY_GROUPS);

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_wrong_permission', async () => {
    await SecurityGroupsFactory(5);
    const securityGroupAdmin = await SecurityGroupFactory(false, {
      permissions: [SecurityGroupPermissionsEnum.DELETE_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroupAdmin.id
    });

    const res = await post(SECURITY_GROUPS, {}, admin.token);

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('security_groups', async () => {
    await SecurityGroupsFactory(5);
    const securityGroupAdmin = await SecurityGroupFactory(false, {
      permissions: [SecurityGroupPermissionsEnum.READ_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroupAdmin.id
    });

    const res = await post(SECURITY_GROUPS, {}, admin.token);

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.length).toEqual(6);
  });
});
