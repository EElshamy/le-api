import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { UpdateSystemConfigInput } from '@src/system-configuration/inputs/update-system-config.input';
import { SystemConfig } from '../models/system-config.model';

@Injectable()
export class SysConfigService {
  constructor(
    @Inject(Repositories.SystemConfigRepository)
    private readonly systemConfigRepo: IRepository<SystemConfig>
  ) {}

  async updateContactInfoBoard(
    systemConfigId: string,
    input: UpdateSystemConfigInput
  ): Promise<SystemConfig> {
    const contactInfo = await this.systemConfigRepo.findOne({
      id: systemConfigId
    });

    if (!contactInfo) {
      throw new BaseHttpException(ErrorCodeEnum.SYSTEM_CONFIG_NOT_EXIST);
    }

    this.validateVatPercentages(input, contactInfo);

    return await this.systemConfigRepo.updateOneFromExistingModel(
      contactInfo,
      input
    );
  }

  async createDefaultSystemConfig(
    input: UpdateSystemConfigInput
  ): Promise<SystemConfig> {
    const systemConfig = await this.systemConfigRepo.findOne({});

    if (systemConfig) {
      return await this.systemConfigRepo.updateOneFromExistingModel(
        systemConfig,
        input
      );
    }

    return await this.systemConfigRepo.createOne(input);
  }

  async getContactInfoBoard(): Promise<SystemConfig> {
    const contactInfo = await this.systemConfigRepo.findOne({});
    return contactInfo;
  }

  private validateVatPercentages(
    input: UpdateSystemConfigInput,
    existingConfig: SystemConfig
  ) {
    const vat = input.vat ?? existingConfig.vat ?? 0;
    const paymentGatewayVat =
      input.paymentGatewayVat ?? existingConfig.paymentGatewayVat ?? 0;

    if (vat + paymentGatewayVat > 100) {
      throw new BaseHttpException(
        ErrorCodeEnum.VAT_PERCENTAGE_SUM_SHOULD_NOT_EXCEED_100
      );
    }
  }
}
