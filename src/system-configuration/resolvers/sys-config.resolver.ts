import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '@src/auth/auth.guard';
import { UpdateSystemConfigInput } from '../inputs/update-system-config.input';
import { SystemConfig } from '../models/system-config.model';
import { SysConfigService } from '../services/sys-config.service';
import { GqlSystemConfigResponse } from '../types/sys-config.response';
import { HasPermission } from '@src/auth/auth.metadata';
import { ContactMessagePermissionsEnum, LegalContentPermissionsEnum } from '@src/security-group/security-group-permissions';

@Resolver(() => SystemConfig)
export class SysConfigResolver {
  constructor(private readonly sysConfigService: SysConfigService) {}

  // *************************** Mutations *************************** //

  // @HasPermision()
  @UseGuards(AuthGuard)
  @HasPermission(ContactMessagePermissionsEnum.UPDATE_CONTACT_MESSAGES)
  @Mutation(() => GqlSystemConfigResponse)
  async updateContactInfoBoard(
    @Args('systemConfigId') systemConfigId: string,
    @Args('input') input: UpdateSystemConfigInput
  ) {
    return await this.sysConfigService.updateContactInfoBoard(
      systemConfigId,
      input
    );
  }

  // *************************** Queries *************************** //

  @Query(() => GqlSystemConfigResponse)
  async getContactInfoBoard() {
    return await this.sysConfigService.getContactInfoBoard();
  }
}
