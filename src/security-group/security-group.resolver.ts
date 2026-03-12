import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import {
  GqlBooleanResponse,
  GqlStringArrayResponse
} from '@src/_common/graphql/graphql-response.type';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { AuthGuard } from '@src/auth/auth.guard';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { AssignSecurityGroupToUsersInput } from './inputs/assign-security-group-to-users.input';
import { CreateSecurityGroupInput } from './inputs/create-security-group.input';
import { DeleteSecurityGroupInput } from './inputs/delete-security-group.input';
import { SecurityGroupInput } from './inputs/security-group.input';
import { SecurityGroupSortBoardArgs } from './inputs/security-groups-sort.input';
import { UnAssignSecurityGroupToUsersInput } from './inputs/un-assign-security-group.input';
import { UpdateSecurityGroupInput } from './inputs/update-security-group.input';
import {
  getAllPermissions,
  getGroupedPermissions,
  RolesPermissionsEnum,
  SecurityGroupPermissionsEnum
} from './security-group-permissions';
import { SecurityGroup } from './security-group.model';
import {
  GqlPermissionsGroupsArrayResponse,
  GqlSecurityGroupResponse,
  GqlSecurityGroupsArrayResponse,
  GqlSecurityGroupsPaginatedResponse
} from './security-group.response';
import { SecurityGroupService } from './security-group.service';
import { UserRoleEnum } from '@src/user/user.enum';

@UseGuards(AuthGuard)
@Resolver(of => SecurityGroup)
export class SecurityGroupResolver {
  constructor(private readonly securityGroupService: SecurityGroupService) {}

  //** --------------------- QUERIES --------------------- */

  @Query(returns => GqlSecurityGroupsArrayResponse)
  async securityGroups() {
    return await this.securityGroupService.securityGroups();
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(RolesPermissionsEnum.READ_ROLES)
  @Query(returns => GqlSecurityGroupsPaginatedResponse)
  async securityGroupsBoard(
    @Args({ nullable: true }) sort: SecurityGroupSortBoardArgs,
    @Args({ nullable: true }) paginate: NullablePaginatorInput,
    @Args('adminId', { type: () => String, nullable: true }) adminId: string,
    @Args('searchKey', { type: () => String, nullable: true }) searchKey?: string
  ) {
    return await this.securityGroupService.securityGroupsBoard(
      sort.sort,
      paginate.paginate,
      adminId,
      searchKey,
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(RolesPermissionsEnum.READ_ROLES)
  @Query(returns => GqlSecurityGroupResponse)
  async securityGroup(@Args() input: SecurityGroupInput) {
    return await this.securityGroupService.securityGroupOrError(
      input.securityGroupId
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(RolesPermissionsEnum.READ_ROLES)
  @Query(returns => GqlStringArrayResponse)
  async getAllPermissions() {
    return getAllPermissions();
  }

  @Query(returns => GqlPermissionsGroupsArrayResponse)
  async getGroupedPermissions() {
    return getGroupedPermissions();
  }

  //** --------------------- MUTATIONS --------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(RolesPermissionsEnum.CREATE_ROLES)
  @Mutation(returns => GqlSecurityGroupResponse)
  async createSecurityGroup(@Args('input') input: CreateSecurityGroupInput) {
    return await this.securityGroupService.createSecurityGroup(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(RolesPermissionsEnum.UPDATE_ROLES)
  @Mutation(returns => GqlSecurityGroupResponse)
  async updateSecurityGroup(@Args('input') input: UpdateSecurityGroupInput) {
    return await this.securityGroupService.updateSecurityGroup(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(RolesPermissionsEnum.UPDATE_ROLES)
  @Mutation(returns => GqlSecurityGroupResponse)
  async assignSecurityGroupToUsers(
    @Args('input') input: AssignSecurityGroupToUsersInput
  ) {
    return await this.securityGroupService.assignSecurityGroup(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(RolesPermissionsEnum.UPDATE_ROLES)
  @Mutation(returns => GqlBooleanResponse)
  async unAssignSecurityGroup(
    @Args('input') input: UnAssignSecurityGroupToUsersInput
  ) {
    return await this.securityGroupService.unAssignSecurityGroup(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(RolesPermissionsEnum.DELETE_ROLES)
  @Mutation(returns => GqlBooleanResponse)
  async deleteSecurityGroup(@Args() input: DeleteSecurityGroupInput) {
    return await this.securityGroupService.deleteSecurityGroup(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(RolesPermissionsEnum.UPDATE_ROLES)
  @Mutation(returns => GqlSecurityGroupResponse)
  async activateOrDeactivateSecurityGroup(
    @Args('securityGroupId') securityGroupId: string
  ) {
    return await this.securityGroupService.activateOrDeactivateSecurityGroup(
      securityGroupId
    );
  }

  //** ------------------ RESOLVE FIELDS ------------------ */

  @ResolveField(type => Timestamp)
  createdAt(@Parent() securityGroup) {
    return new Date(securityGroup.createdAt).valueOf();
  }

  @ResolveField(type => Timestamp)
  updatedAt(@Parent() securityGroup) {
    return new Date(securityGroup.updatedAt).valueOf();
  }
}
