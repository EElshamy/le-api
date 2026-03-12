import { ExecutionContext, Inject } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlContext } from '../../graphql/graphql-context.type';
import { ErrorCodeEnum } from '../../exceptions/error-code.enum';
import { BaseHttpException } from '../../exceptions/base-http-exception';
import { IAuthGuard } from './interface/auth-guard.interface';
import { IContextAuthService } from '../../context/context-auth.interface';
import { AuthOpts } from '../../decorators/auth.decorator';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { UserSession } from '@src/user-sessions/user-sessions.model';

export class AdminOnlyGuard implements IAuthGuard {
  constructor(
    public readonly authOpts: AuthOpts,
    public readonly authService: IContextAuthService,
    // @Inject(Repositories.UserSessionsRepository)
    // private readonly userSessionRepo: IRepository<UserSession>
  ) {}

  unauthorizedException = new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { currentUser, sessionId } = ctx.getContext() as GqlContext;
    const { permissions, error } = this.authOpts;

    this.unauthorizedException = error ? new BaseHttpException(error) : this.unauthorizedException;
    if (!currentUser) throw this.unauthorizedException;
    // if (sessionId) {
    //   const session = await this.userSessionRepo.findOne({ id: sessionId });
    //   if (!session || !session.isActive) throw this.unauthorizedException;
    // }

    if (
      permissions &&
      permissions.length &&
      !this.authService.hasPermission(permissions[0], currentUser)
    ) {
      throw this.unauthorizedException;
    }

    return true;
  }
}
