import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlStringResponse } from '@src/_common/graphql/graphql-response.type';
import { AuthGuard } from '@src/auth/auth.guard';
import { HasPermission } from '@src/auth/auth.metadata';
import { AppConfigurationPermissionsEnum } from '@src/security-group/security-group-permissions';
import { LangEnum } from '../user/user.enum';
import { AppConfiguration } from './app-configuration.model';
import {
  GqlAppConfigurationResponse,
  GqlAppConfigurationsArrayResponse
} from './app-configuration.response';
import { AppConfigurationService } from './app-configuration.service';
import { AppConfigurationInput } from './inputs/app-configuration.input';
import { CreateAppConfigurationInput } from './inputs/create-app-configuration.input';
import { UpdateAppConfigurationInput } from './inputs/update-app-configuration.input';

@Resolver(of => AppConfiguration)
export class AppConfigurationResolver {
  constructor(
    private readonly appConfigurationService: AppConfigurationService
  ) {}

  //** --------------------- QUERIES --------------------- */

  @Query(returns => GqlStringResponse)
  async termsAndConditions(@Context('lang') lang: LangEnum) {
    return await this.appConfigurationService.localizedAppConfiguration(
      'terms',
      lang
    );
  }

  @Query(returns => GqlStringResponse)
  async treatmentConsent(@Context('lang') lang: LangEnum) {
    return await this.appConfigurationService.localizedAppConfiguration(
      'treatment',
      lang
    );
  }

  @HasPermission(AppConfigurationPermissionsEnum.READ_APP_CONFIGURATION)
  @UseGuards(AuthGuard)
  @Query(returns => GqlAppConfigurationResponse)
  async appConfigurationBoard(@Args('input') input: AppConfigurationInput) {
    return await this.appConfigurationService.checkIfConfigurationExists(input);
  }

  @HasPermission(AppConfigurationPermissionsEnum.READ_APP_CONFIGURATION)
  @UseGuards(AuthGuard)
  @Query(returns => GqlAppConfigurationsArrayResponse)
  async appConfigurationsBoard() {
    return await this.appConfigurationService.appConfigurationsBoard();
  }

  //** --------------------- MUTATIONS --------------------- */

  @HasPermission(AppConfigurationPermissionsEnum.CREATE_APP_CONFIGURATION)
  @UseGuards(AuthGuard)
  @Mutation(returns => GqlAppConfigurationResponse)
  async createAppConfigurationBoard(
    @Args('input') input: CreateAppConfigurationInput
  ) {
    return await this.appConfigurationService.createAppConfigurationBoard(
      input
    );
  }

  @HasPermission(AppConfigurationPermissionsEnum.UPDATE_APP_CONFIGURATION)
  @UseGuards(AuthGuard)
  @Mutation(returns => GqlAppConfigurationResponse)
  async updateAppConfigurationBoard(
    @Args('input') input: UpdateAppConfigurationInput
  ) {
    return await this.appConfigurationService.updateAppConfigurationBoard(
      input
    );
  }
}
