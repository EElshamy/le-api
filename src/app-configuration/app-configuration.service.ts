import { Inject } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { HelperService } from '@src/_common/utils/helper.service';
import { Op } from 'sequelize';
import { LangEnum } from '../user/user.enum';
import { AppConfiguration } from './app-configuration.model';
import { AppConfigurationInput } from './inputs/app-configuration.input';
import { CreateAppConfigurationInput } from './inputs/create-app-configuration.input';
import { UpdateAppConfigurationInput } from './inputs/update-app-configuration.input';

export class AppConfigurationService {
  constructor(
    private readonly helperService: HelperService,
    @Inject(Repositories.AppConfigurationsRepository)
    private readonly appConfigurationRepo: IRepository<AppConfiguration>
  ) {}

  async localizedAppConfiguration(
    key: string,
    lang: LangEnum
  ): Promise<string> {
    const config = await this.appConfigurationRepo.findOne({
      key: `${lang.toLowerCase()}${this.helperService.upperCaseFirstLetter(key)}`
    });
    return config ? config.value : null;
  }

  async appConfigurationsBoard(): Promise<AppConfiguration[]> {
    const terms = await this.appConfigurationRepo.findAll();
    return terms;
  }

  async createAppConfigurationBoard(
    input: CreateAppConfigurationInput
  ): Promise<AppConfiguration> {
    await this.checkIfConfigurationHasUniqueKeyOrError(input.key);
    return await this.appConfigurationRepo.createOne({ ...input });
  }

  async appConfigurationValueByKey(key: string): Promise<string> {
    const config = await this.appConfigurationRepo.findOne({ key });
    return config !== null ? config.value : null;
  }

  async updateAppConfigurationBoard(
    input: UpdateAppConfigurationInput
  ): Promise<AppConfiguration> {
    const appConfiguration = await this.appConfigurationRepo.findOne({
      id: input.appConfigurationId
    });
    if (!appConfiguration)
      throw new BaseHttpException(ErrorCodeEnum.CONFIGURATION_NOT_EXISTS);
    if (input.key)
      await this.checkIfConfigurationHasSameKeyInAnotherInstance(
        input.key,
        input.appConfigurationId
      );
    return await this.appConfigurationRepo.updateOneFromExistingModel(
      appConfiguration,
      {
        ...input
      }
    );
  }

  async checkIfConfigurationHasUniqueKeyOrError(key: string): Promise<void> {
    const appConfiguration = await this.appConfigurationRepo.findOne({
      key: key
    });
    if (appConfiguration)
      throw new BaseHttpException(
        ErrorCodeEnum.CONFIGURATION_SHOULD_HAS_UNIQUE_KEY
      );
  }

  async checkIfConfigurationHasSameKeyInAnotherInstance(
    key: string,
    appConfigurationId: string
  ): Promise<void> {
    const appConfiguration = await this.appConfigurationRepo.findOne({
      key: key,
      id: { [Op.ne]: appConfigurationId }
    });
    if (appConfiguration)
      throw new BaseHttpException(
        ErrorCodeEnum.CONFIGURATION_SHOULD_HAS_UNIQUE_KEY
      );
  }

  async checkIfConfigurationExists(
    input: AppConfigurationInput
  ): Promise<AppConfiguration> {
    const appConfiguration = await this.appConfigurationRepo.findOne({
      [Op.or]: [
        ...(input.key ? [{ key: input.key }] : []),
        ...(input.appConfigurationId ? [{ id: input.appConfigurationId }] : [])
      ]
    });
    if (!appConfiguration)
      throw new BaseHttpException(ErrorCodeEnum.CONFIGURATION_NOT_EXISTS);
    return appConfiguration;
  }
}
