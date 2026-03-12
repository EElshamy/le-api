import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IContextAuthService, IContextAuthServiceToken } from '../context/context-auth.interface';
import { IAuthGuard } from './auth/interface/auth-guard.interface';
import { AuthGuards } from './auth';
import { AuthOpts } from '../decorators/auth.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlContext } from '../graphql/graphql-context.type';
import { BaseHttpException } from '../exceptions/base-http-exception';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';
import { Repositories } from '../database/database-repository.enum';
import { IRepository } from '../database/repository.interface';
import { UserSession } from '@src/user-sessions/user-sessions.model';

@Injectable()
export class MediatorGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(IContextAuthServiceToken)
    private readonly authService: IContextAuthService,
    // @Inject(Repositories.UserSessionsRepository)
    // private readonly userSessionRepo: IRepository<UserSession>
  ) {}

  private guard: IAuthGuard;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { currentUser } = ctx.getContext() as GqlContext;
    if (currentUser?.isBlocked) throw new BaseHttpException(ErrorCodeEnum.BLOCKED_USER);
    const authOpts =
      this.reflector.get<AuthOpts>('authOpts', context.getHandler()) ||
      this.reflector.get<AuthOpts>('authOpts', context.getClass());

    this.guard = new AuthGuards[authOpts.allow || 'authenticated'](authOpts, this.authService);
    return this.guard.canActivate(context);
  }
}
