import { NOT_EXISTED_UUID } from '../constants';
import { UN_ASSIGN_SECURITY_GROUP_TO_USERS } from '../graphql/security-group';
import { post } from '../request';
import { buildRepository } from './../../src/_common/database/database-repository.builder';
import { IRepository } from './../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from './../../src/_common/exceptions/error-code.enum';
import { SecurityGroupPermissionsEnum } from './../../src/security-group/security-group-permissions';
import { SecurityGroupFactory } from './../../src/security-group/security-group.factory';
import {
  UserFactory,
  UsersFactory
} from './../../src/user/factories/user.factory';
import { User } from './../../src/user/models/user.model';
import { rollbackDbForSecurityGroup } from './rollback-for-security-group';

const userRepo = new (buildRepository(User))() as IRepository<User>;

describe('Un assign security group to users suite test', () => {
  afterEach(async () => {
    await rollbackDbForSecurityGroup();
  });

  it('return_error_if_not_authorized', async () => {
    const users = await UsersFactory(4);
    const usersIds = users.map(user => user.id);
    const res = await post(UN_ASSIGN_SECURITY_GROUP_TO_USERS, {
      input: {
        usersIds
      }
    });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_one_or_more_user_not_exist', async () => {
    const securityGroup = await SecurityGroupFactory(false, {
      permissions: [
        SecurityGroupPermissionsEnum.UN_ASSIGN_SECURITY_GROUPS_TO_USERS
      ]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroup.id
    });
    const users = await UsersFactory(4);
    const usersIds = users.map(user => user.id);

    usersIds.push(NOT_EXISTED_UUID);
    const res = await post(
      UN_ASSIGN_SECURITY_GROUP_TO_USERS,
      { input: { usersIds } },
      admin.token
    );

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.USER_DOES_NOT_EXIST);
  });

  it('return_error_if_wrong_permission', async () => {
    const securityGroup = await SecurityGroupFactory(false, {
      permissions: [SecurityGroupPermissionsEnum.DELETE_SECURITY_GROUPS]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroup.id
    });
    const users = await UsersFactory(4);
    const usersIds = users.map(user => user.id);

    const res = await post(
      UN_ASSIGN_SECURITY_GROUP_TO_USERS,
      { input: { usersIds } },
      admin.token
    );

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('un_assign_security_group_to_users', async () => {
    const securityGroup = await SecurityGroupFactory(false, {
      permissions: [
        SecurityGroupPermissionsEnum.UN_ASSIGN_SECURITY_GROUPS_TO_USERS
      ]
    });
    const admin = await UserFactory(false, {
      securityGroupId: securityGroup.id
    });
    const users = await UsersFactory(4, { securityGroupId: securityGroup.id });
    const usersIds = users.map(user => user.id);

    const assignedUsers = await userRepo.findAll({ id: usersIds });
    expect(
      assignedUsers.every(user => user.securityGroupId === securityGroup.id)
    ).toBeTruthy();

    const res = await post(
      UN_ASSIGN_SECURITY_GROUP_TO_USERS,
      { input: { usersIds } },
      admin.token
    );
    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data).toBe(true);

    const unAssignedUsers = await userRepo.findAll({ id: usersIds });
    expect(unAssignedUsers.every(user => !user.securityGroupId)).toBeTruthy();
  });
});
