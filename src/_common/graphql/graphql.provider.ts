import { ApolloDriverConfig } from '@nestjs/apollo';
import { Inject, Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { User } from '@src/user/models/user.model';
import { Request, Response } from 'express';
import { join } from 'path';
import {
  IContextAuthService,
  IContextAuthServiceToken
} from '../context/context-auth.interface';
import { IDataLoaderService } from '../dataloader/dataloader.interface';
import { DataloaderService } from '../dataloader/dataloader.service';
import { env } from '../utils/env';
import { formatGraphqlErrors } from './format-errors';
import {
  GqlContext,
  GraphqlExtraType,
  UserFromHeadersType
} from './graphql-context.type';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
  constructor(
    @Inject(IContextAuthServiceToken)
    private readonly authService: IContextAuthService,
    @Inject(DataloaderService)
    private readonly dataloaderService: IDataLoaderService
  ) {}

  createGqlOptions(): ApolloDriverConfig {
    return {
      formatError: formattedError => formatGraphqlErrors(formattedError),
      playground: env.NODE_ENV !== 'production',
      introspection: true,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      cache: 'bounded',
      persistedQueries: false,
      csrfPrevention: true,
      context: async ({
        req,
        res,
        extra
      }: {
        req: Request;
        res: Response;
        extra: GraphqlExtraType;
      }): Promise<GqlContext> => {
        let currentUser: User | undefined;
        let userAndSession: UserFromHeadersType | undefined;

        const locale = this.authService.getLocale(req);

        if (extra?.currentUser) {
          currentUser = extra.currentUser;
        } else {
          userAndSession = await this.authService.getUserFromReqHeaders(
            req,
            locale.lang
          );
          currentUser = userAndSession?.user;
        }

        return {
          req,
          res,
          currentUser,
          lang: extra ? extra.lang : locale.lang,
          country: locale.country,
          timezone: this.authService.getTimezone(undefined),
          loaders: this.dataloaderService.createLoaders(currentUser),
          ipAddress: req ? this.authService.getIpAddress(req) : null,
          sessionId: userAndSession?.sessionId,
          isTempToken: userAndSession?.isTempToken
        };
      },

      subscriptions: {
        'graphql-ws': {
          onConnect: async context => {
            const { connectionParams, extra } = context;
            if (connectionParams) {
              const req = { headers: connectionParams };
              (extra as any).currentUser =
                await this.authService.getUserFromReqHeaders(
                  req as unknown as Request
                );
            }
          }
        },
        'subscriptions-transport-ws': {
          onConnect: async connectionParams => {
            if (connectionParams) {
              const req = { headers: connectionParams };
              return {
                currentUser: await this.authService.getUserFromReqHeaders(
                  req as unknown as Request
                )
              };
            }
          },
          onDisconnect() {}
        }
      }
    };
  }
}
