import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';
import { HelperService } from '@src/_common/utils/helper.service';
import { CodePrefix } from '@src/_common/utils/helpers.enum';
import { User } from '@src/user/models/user.model';
import { Op } from 'sequelize';
import { AssignSecurityGroupToUsersInput } from './inputs/assign-security-group-to-users.input';
import { CreateSecurityGroupInput } from './inputs/create-security-group.input';
import { DeleteSecurityGroupInput } from './inputs/delete-security-group.input';
import { SecurityGroupSortInput } from './inputs/security-groups-sort.input';
import { UnAssignSecurityGroupToUsersInput } from './inputs/un-assign-security-group.input';
import { UpdateSecurityGroupInput } from './inputs/update-security-group.input';
import { SecurityGroup } from './security-group.model';
import { SecurityGroupSortEnum } from './enums/security-group-sort.enum';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';

@Injectable()
export class SecurityGroupService {
  constructor(
    @Inject(Repositories.SecurityGroupsRepository)
    private readonly securityGroupRepo: IRepository<SecurityGroup>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    private readonly helper: HelperService
  ) {}

  async createSecurityGroup(
    input: CreateSecurityGroupInput
  ): Promise<SecurityGroup> {
    const otherSecurityGroupWithSameName = await this.securityGroupRepo.findOne(
      {
        groupName: input.groupName
      }
    );

    if (otherSecurityGroupWithSameName) {
      throw new BaseHttpException(
        ErrorCodeEnum.SECURITY_GROUP_NAME_ALREADY_EXISTS
      );
    }

    return await this.securityGroupRepo.createOne({
      ...input,
      code: await this.helper.generateModelCodeWithPrefix(
        CodePrefix.SECURITY_GROUP,
        this.securityGroupRepo
      )
    });
  }

  async updateSecurityGroup(input: UpdateSecurityGroupInput) {
    const securityGroup = await this.securityGroupOrError(
      input.securityGroupId
    );

    const otherSecurityGroupWithSameName = await this.securityGroupRepo.findOne(
      {
        id: { [Op.ne]: input.securityGroupId },
        groupName: input.groupName
      }
    );
    if (otherSecurityGroupWithSameName)
      throw new BaseHttpException(
        ErrorCodeEnum.SECURITY_GROUP_NAME_ALREADY_EXISTS
      );

    return await this.securityGroupRepo.updateOneFromExistingModel(
      securityGroup,
      input
    );
  }

  async assignSecurityGroup(input: AssignSecurityGroupToUsersInput) {
    const securityGroup = await this.securityGroupOrError(
      input.securityGroupId
    );

    const users = await this.userRepo.findAll({
      id: { [Op.in]: input.usersIds }
    });
    if (users.length !== input.usersIds.length)
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);

    await this.userRepo.updateAll(
      { id: { [Op.in]: input.usersIds } },
      { securityGroupId: input.securityGroupId }
    );

    return securityGroup;
  }

  async unAssignSecurityGroup(input: UnAssignSecurityGroupToUsersInput) {
    const users = await this.userRepo.findAll({
      id: { [Op.in]: input.usersIds }
    });
    if (users.length !== input.usersIds.length)
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    await this.userRepo.updateAll(
      { id: { [Op.in]: input.usersIds } },
      { securityGroupId: null }
    );
    return true;
  }

  async securityGroups(): Promise<SecurityGroup[]> {
    return await this.securityGroupRepo.findAll();
  }

  async securityGroupsBoard(
    sort: SecurityGroupSortInput,
    paginator: PaginatorInput = { page: 1, limit: 8 },
    adminId?: string,
    searchKey?: string
  ) {
    let adminSecurityGroupId: string = null;
    if (adminId) {
      adminSecurityGroupId = (
        await this.userRepo.findOne({
          id: adminId,
          isDeleted: false,
          isBlocked: false
        })
      )?.securityGroupId;
    }

    return await this.securityGroupRepo.findPaginated(
      {
        ...(searchKey && { groupName: { [Op.iLike]: `%${searchKey}%` } }),
        ...(adminSecurityGroupId && { id: { [Op.ne]: adminSecurityGroupId } })
      },
      [
        [
          sort?.sortBy || SecurityGroupSortEnum.CREATED_AT,
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],

      paginator.page,
      paginator.limit
    );
  }

  async deleteSecurityGroup(input: DeleteSecurityGroupInput) {
    const group = await this.securityGroupOrError(input.securityGroupId);

    // if there an admin is assigned to this security group then it can't be deleted

    const assignedAdmins = await this.userRepo.findAll({
      securityGroupId: group.id,
      isBlocked: false,
      isDeleted: false
    });
    if (assignedAdmins.length > 0)
      throw new BaseHttpException(
        ErrorCodeEnum.ADMINS_ASSIGNED_TO_SECURITY_GROUP
      );

    if (group.groupName === 'SuperAdmin') {
      throw new BaseHttpException(ErrorCodeEnum.CANT_DELETE_SUPER_ADMIN_GROUP);
    }

    await this.securityGroupRepo.deleteOne({ id: input.securityGroupId });

    return true;
  }

  async securityGroupOrError(securityGroupId: string): Promise<SecurityGroup> {
    const securityGroup = await this.securityGroupRepo.findOne({
      id: securityGroupId
    });

    if (!securityGroup)
      throw new BaseHttpException(ErrorCodeEnum.SECURITY_GROUP_DOES_NOT_EXIST);
    return securityGroup;
  }

  async activateOrDeactivateSecurityGroup(securityGroupId: string) {
    const securityGroup = await this.securityGroupRepo.findOne({
      id: securityGroupId
    });

    if (!securityGroup) {
      throw new BaseHttpException(ErrorCodeEnum.SECURITY_GROUP_DOES_NOT_EXIST);
    }

    return await this.securityGroupRepo.updateOneFromExistingModel(
      securityGroup,
      { isActive: !securityGroup.isActive }
    );
  }
}
