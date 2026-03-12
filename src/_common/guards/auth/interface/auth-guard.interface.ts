import { CanActivate, ExecutionContext } from '@nestjs/common';
import { IContextAuthService } from '../../../context/context-auth.interface';
import { BaseHttpException } from '../../../exceptions/base-http-exception';
import { AuthOpts } from '../../../decorators/auth.decorator';

export interface IAuthGuard extends CanActivate {
  /**
   * Represents the exception that is thrown if the user is not authenticated.
   * The default value is `BaseHttpException(ErrorCodeEnum.UNAUTHORIZED)`.
   *
   * @type {BaseHttpException}
   */
  unauthorizedException?: BaseHttpException;
  canActivate(context: ExecutionContext): Promise<boolean>;
  authOpts: AuthOpts;
  authService: IContextAuthService;
}
