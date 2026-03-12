import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';
import { MediatorGuard } from '../guards/mediator.guard';
import { AuthGuards } from '../guards/auth';
import { UserRoleEnum } from '../../user/user.enum';

export interface AuthOpts {
  allow?: keyof typeof AuthGuards;
  permissions?: string[];
  error?: ErrorCodeEnum;
  roles?: UserRoleEnum[];
}

export const SetAuthOpts = (opts: AuthOpts) => SetMetadata('authOpts', opts);

export const Auth = (opts: AuthOpts = { allow: 'authenticated' }) =>
  applyDecorators(SetMetadata('authOpts', opts), UseGuards(MediatorGuard));
