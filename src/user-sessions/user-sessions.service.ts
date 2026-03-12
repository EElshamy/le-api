import { Inject, Injectable } from '@nestjs/common';
import { LoginDetailsInput } from './inputs/login-details.input';
import * as geoip from 'fast-geoip';
import { Repositories } from '../_common/database/database-repository.enum';
import { IRepository } from '../_common/database/repository.interface';
import { UserSession } from './user-sessions.model';
import { ActionTypeEnum } from './user-sessions.enum';
import { Op, Transaction } from 'sequelize';
import { subDays } from 'date-fns';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { DeviceEnum, UserRoleEnum } from '@src/user/user.enum';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { User } from '@src/user/models/user.model';

@Injectable()
export class UserSessionService {
  constructor(
    @Inject(Repositories.UserSessionsRepository)
    private readonly userSessionRepo: IRepository<UserSession>,
    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>
  ) {}

  async createUserSession(input: LoginDetailsInput): Promise<string> {
    const countryAndCity = await this.countryAndCityFromIpTransformer(
      input.ipAddress
    );

    const user = await this.usersRepo.findOne({ id: input.userId });

    // deactivate old sessions (except the newly created one)
    if (user.role === UserRoleEnum.USER) {
      await this.userSessionRepo.updateAll(
        { userId: input.userId },
        { isActive: false },
        input.transaction
      );
    }

    // we want to prevent users from logging in from multiple devices
    // ! we need to handle this with admin
    // if (process.env.NODE_ENV === 'production') {
    //   const existingSession = await this.userSessionRepo.findOne({
    //     userId: input.userId,
    //     device:
    //       input?.device === DeviceEnum.DESKTOP ?
    //         DeviceEnum.DESKTOP
    //       : { [Op.ne]: DeviceEnum.DESKTOP },
    //     isActive: true
    //   });

    //   if (existingSession) {
    //     throw new BaseHttpException(
    //       input?.device === DeviceEnum.DESKTOP ?
    //         ErrorCodeEnum.ALREADY_LOGGED_IN_FROM_BROWSER
    //       : ErrorCodeEnum.ALREADY_LOGGED_IN_FROM_MOBILE
    //     );
    //   }
    // }

    const session = await this.userSessionRepo.createOne(
      { ...input, ...countryAndCity },
      input.transaction
    );

    if (session.actionType === ActionTypeEnum.LOGIN) {
      await this.deleteOldInactiveUserSession(input.userId, input.transaction);
    }
    return session.id;
  }

  private async countryAndCityFromIpTransformer(ipAddress: string) {
    let location;
    try {
      location = await geoip.lookup(ipAddress);
    } catch (err) {
      console.log('location erro', err);
    }
    return (
      location && {
        country: location?.country,
        city: location?.city
      }
    );
  }

  private async deleteOldInactiveUserSession(
    userId: string,
    transaction?: Transaction
  ) {
    return await this.userSessionRepo.deleteAll(
      {
        //TODO: remove abandoned sessions????
        userId,
        isActive: false,
        actionType: ActionTypeEnum.LOGIN,
        createdAt: { [Op.lt]: subDays(new Date(), 30) }
      },
      transaction
    );
  }

  async deactivateUserSession(sessionId: string) {
    try {
      await this.userSessionRepo.updateAll(
        {
          id: sessionId
        },
        { isActive: false }
      );
    } catch (err) {
      return false;
    }

    return true;
  }

  async getSignUpSessionId(userId: string) {
    return (
      await this.userSessionRepo.findOne({
        userId,
        actionType: ActionTypeEnum.SIGN_UP
      })
    )?.id;
  }

  async deactivateUserSessions(
    userId: string,
    currentSessionId?: string,
    transaction?: Transaction
  ) {
    await this.userSessionRepo.updateAll(
      {
        userId,
        isActive: true,
        ...(currentSessionId && {
          id: { [Op.not]: currentSessionId }
        })
      },
      { isActive: false }
    );
    return true;
  }
}
