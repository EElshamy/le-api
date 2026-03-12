import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { Op, Optional } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../user/models/user.model';
import {
  DeleteVerificationCodeAndUpdateUserModelInput,
  ValidVerificationCodeOrErrorInput,
} from '../user/user.interface';
import { UserVerificationCode } from './user-verification-code.model';

@Injectable()
export class UserVerificationCodeService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(Repositories.UserVerificationCodesRepository)
    private readonly userVerificationCodeRepo: IRepository<UserVerificationCode>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize
  ) {}

  // generateVerificationCodeAndExpiryDate(): VerificationCodeAndExpirationDate {
  //   const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  //   return {
  //     // verificationCode,
  //     verificationCode:
  //       this.configService.get('NODE_ENV') === 'production' ?
  //         Math.floor(1000 + Math.random() * 9000).toString()
  //       : '1234',
  //     expiryDate: new Date(Date.now() + 10 * 60 * 1000)
  //   };
  // }

  generateVerificationCodeAndExpiryDate(isFixedOtp: boolean = false) {
    const isProd = this.configService.get('NODE_ENV') === 'production';

    let verificationCode: string;

    if (!isProd) {
      verificationCode = '1234';
    } else {
      verificationCode =
        isFixedOtp ?
          '1234' // isFixed = true
        : Math.floor(1000 + Math.random() * 9000).toString();
    }

    return {
      verificationCode,
      expiryDate: new Date(Date.now() + 10 * 60 * 1000)
    };
  }

  async validVerificationCodeOrError(input: ValidVerificationCodeOrErrorInput) {
    const verificationCode = await this.userVerificationCodeRepo.findOne({
      userId: input.user.id,
      code: input.verificationCode,
      useCase: input.useCase,
      expiryDate: {
        [Op.gt]: new Date()
      }
    });

    if (!verificationCode) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_VERIFICATION_CODE);
    }

    return verificationCode;
  }

  async deleteVerificationCodeAndUpdateUserModel(
    input: DeleteVerificationCodeAndUpdateUserModelInput,
    fieldsWillUpdated: Optional<User, keyof User>
  ): Promise<User> {
    return await this.sequelize.transaction(async transaction => {
      await this.userVerificationCodeRepo.deleteAll(
        { userId: input.user.id, useCase: input.useCase },
        transaction
      );
      return await this.userRepo.updateOneFromExistingModel(
        input.user,
        fieldsWillUpdated,
        transaction
      );
    });
  }
}
