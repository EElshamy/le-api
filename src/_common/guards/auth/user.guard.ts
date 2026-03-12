import { ExecutionContext, Inject } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { BaseHttpException } from '../../exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../exceptions/error-code.enum';
import { GqlContext } from '../../graphql/graphql-context.type';
import { IAuthGuard } from './interface/auth-guard.interface';
import { IContextAuthService } from '../../context/context-auth.interface';
import { AuthOpts } from '../../decorators/auth.decorator';
import { UserRoleEnum } from '../../../user/user.enum';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { UserSession } from '@src/user-sessions/user-sessions.model';

export class UserOnlyGuard implements IAuthGuard {
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

    if (!currentUser) throw this.unauthorizedException;

    // if (sessionId) {
    //   const session = await this.userSessionRepo.findOne({ id: sessionId });
    //   if (!session || !session.isActive) throw this.unauthorizedException;
    // }

    if (currentUser.role !== UserRoleEnum.USER)
      throw this.unauthorizedException;

    return true;
  }
}
