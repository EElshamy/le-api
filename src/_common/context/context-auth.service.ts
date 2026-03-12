import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { SecurityGroup } from '@src/security-group/security-group.model';
import { User } from '@src/user/models/user.model';
import { LangEnum, UserRoleEnum } from '@src/user/user.enum';
import { isISO31661Alpha2 } from 'class-validator';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { getClientIp } from 'request-ip';
import { TokenPayload } from '../../auth/auth-token-payload.type';
import { ApprovalStatusEnum } from '../../lecturer/enums/lecturer.enum';
import { Lecturer } from '../../lecturer/models/lecturer.model';
import { UserSession } from '../../user-sessions/user-sessions.model';
import { BaseHttpException } from '../exceptions/base-http-exception';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';
import { UserFromHeadersType } from '../graphql/graphql-context.type';
import {
  IContextAuthService,
  IsUserAllowedToContinueInput
} from './context-auth.interface';

@Injectable()
export class ContextAuthService implements IContextAuthService {
  constructor(
    private readonly config: ConfigService,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    // @Inject(Repositories.UserSessionsRepository)
    // private readonly userSessionRepo: IRepository<UserSession>,
    private readonly reflector: Reflector
  ) {}

  getIpAddress(req: Request): string {
    let clientIp = null;
    try {
      clientIp = getClientIp(req);
    } catch (err) {
      console.log('IP ERROORRR', err);
    }
    return clientIp;
  }

  getAuthToken(req: Request): string {
    if (
      req &&
      req.headers &&
      (req.headers.authorization || req.headers.Authorization)
    ) {
      let auth: string;
      if (req.headers.authorization) auth = req.headers.authorization;
      if (req.headers.Authorization) auth = <string>req.headers.Authorization;
      return auth.split(' ')[1];
    }
    return null;
  }

  getTimezone(timezoneAsString = '+02:00') {
    if (timezoneAsString.search(/\-|\+/) < 0) timezoneAsString = '+02:00';
    const mathOperation = timezoneAsString.slice(0, 1);
    const value = timezoneAsString.replace(mathOperation, '');
    const hours =
      isNaN(Number(value.split(':')[0])) ? 2 : Number(value.split(':')[0]);
    const minutes =
      isNaN(value as any) ? 0
      : isNaN(Number(value.split(':')[1])) ? 0
      : Number(value.split(':')[1]);
    return { minusSign: mathOperation === '-', hours, minutes };
  }

  async getUserFromReqHeaders(
    req: Request,
    favLang?: LangEnum
  ): Promise<UserFromHeadersType> {
    let token = this.getAuthToken(req),
      user,
      sessionId,
      isTempToken;
    if (!token) return null;
    try {
      const tokenData = <TokenPayload>(
        jwt.verify(token, this.config.get('JWT_SECRET'))
      );
      sessionId = tokenData.sessionId;
      isTempToken = tokenData.isTemp;

      user = await this.userRepo.findOne({ id: tokenData.userId }, [
        SecurityGroup,
        {
          model: Lecturer,
          attributes: ['status', 'hasCompletedProfile', 'id']
        },
        ...(isTempToken ?
          []
        : [
            {
              model: UserSession,
              required: false,
              where: { id: sessionId },
              attributes: ['id', 'isActive']
            }
          ])
      ]);
    } catch (err) {
      // console.log('context creation failed->', err.message);
      //FIXME:for expired tokens: update session and set isActive:false
      return null;
    }

    if (favLang && user && user.favLang !== favLang) {
      await this.userRepo.updateOneFromExistingModel(user, { favLang });
    }

    return user ?
        { user: user.toJSON() as User, sessionId, isTempToken }
      : { user: null, sessionId, isTempToken };
  }

  getLocale(req: Request): { lang: LangEnum; country: string } {
    if (!req) return { lang: LangEnum.EN, country: 'EG' };
    let locale = <string>req.headers.lang || 'eg-en';
    let country = locale.split('-')[0].toUpperCase();
    if (!country || !isISO31661Alpha2(country)) country = 'EG';
    let lang = locale.split('-')[1] === 'ar' ? LangEnum.AR : LangEnum.EN;
    return { lang, country };
  }

  hasPermission(permission: string, user: User): boolean {
    if (!user || !user.securityGroup || !user.securityGroup.id) return false;
    return user.securityGroup.permissions.includes(permission);
  }

  async isUserAllowedToContinue(input: IsUserAllowedToContinueInput) {
    const {
      isTempToken,
      currentSessionId,
      context,
      currentUser,
      allowTemporaryToken,
      handlerName
    } = input;
    if (!currentUser) throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);

    if (currentUser.isDeleted || currentUser.isBlocked)
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);

    if (
      currentUser.role === UserRoleEnum.LECTURER &&
      currentUser.lecturer.status !== ApprovalStatusEnum.APPROVED
    )
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);

    this.validateRoleAndPermission(context, currentUser);

    if (isTempToken && !allowTemporaryToken)
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);

    if (isTempToken && allowTemporaryToken) return;

    this.validateCurrentSession(currentUser.userSessions, currentSessionId);

    if (
      handlerName !== 'changePasswordBoard' &&
      handlerName !== 'changePassword'
    ) {
      if (currentUser.requireChangePassword) {
        throw new BaseHttpException(ErrorCodeEnum.PASSWORD_CHANGE_REQUIRED);
            }
    }
  }

  private validateRoleAndPermission(context, currentUser: User) {
    const roles = this.reflector.get<UserRoleEnum>(
      'roles',
      context.getHandler()
    );

    if (roles?.length && !roles.includes(currentUser.role)) {
      throw new BaseHttpException(ErrorCodeEnum.PERMISSION_DENIED);
    }

    const permissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );

    if (permissions?.length && !this.hasPermission(permissions[0], currentUser))
      throw new BaseHttpException(ErrorCodeEnum.PERMISSION_DENIED);
  }

  private validateCurrentSession(
    userSessions: UserSession[],
    currentSessionId: string
  ) {
    // const userSession = await this.userSessionRepo.findOne({
    //   id: currentSessionId
    // });
    if (!userSessions?.length)
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);

    if (userSessions[0].id !== currentSessionId)
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);

    if (!userSessions[0].isActive)
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);
  }
}
