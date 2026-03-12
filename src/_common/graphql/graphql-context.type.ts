import { User } from '@src/user/models/user.model';
import { LangEnum } from '@src/user/user.enum';
import { Request , Response } from 'express';
import { IDataLoaders } from '../dataloader/dataloader.interface';
import { Timezone } from './graphql-response.type';

export interface GqlContext {
  currentUser?: User;
  req: Request;
  res: Response;
  lang: LangEnum;
  country: string;
  timezone: Timezone;
  loaders: IDataLoaders;
  sessionId: string;
  ipAddress: string;
  isTempToken: boolean;
}

export type GraphqlExtraType = {
  currentUser?: User;
  loaders?: IDataLoaders;
  lang?: LangEnum;
};

export type UserFromHeadersType = {
  user: User;
  sessionId: string;
  isTempToken: boolean;
};
