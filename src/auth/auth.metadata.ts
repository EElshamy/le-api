import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '../user/user.enum';

export const HasPermission = (...args: string[]) => SetMetadata('permissions', args);

export const HasRole = (...args: UserRoleEnum[]) => SetMetadata('roles', args);
