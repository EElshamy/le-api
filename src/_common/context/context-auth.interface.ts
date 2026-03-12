import { ExecutionContext } from '@nestjs/common';
import { User } from '../../user/models/user.model';
import { LangEnum } from '../../user/user.enum';
import { UserFromHeadersType } from '../graphql/graphql-context.type';
import { Timezone } from '../graphql/graphql-response.type';
import { Request } from 'express';

export const IContextAuthServiceToken = 'IContextAuthService';

export type IsUserAllowedToContinueInput = {
  currentUser: User;
  currentSessionId: string;
  context: ExecutionContext;
  isTempToken: boolean;
  allowTemporaryToken: boolean;
  handlerName: string
};

export interface IContextAuthService {
  getIpAddress(req: Request): string;

  getTimezone(timezoneAsString: string): Timezone;

  getUserFromReqHeaders(req: Request, favLang?: LangEnum): Promise<UserFromHeadersType>;

  getLocale(req: Request): { lang: LangEnum; country: string };

  hasPermission(permission: string, user: User): boolean;

  isUserAllowedToContinue(input: IsUserAllowedToContinueInput);
}
