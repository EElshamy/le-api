import { AdminOnlyGuard } from './admin.guard';
import { UserOnlyGuard } from './user.guard';
import { AuthenticatedGuard } from './authenticated.guard';

export const AuthGuards = {
  user: UserOnlyGuard,
  admin: AdminOnlyGuard,
  authenticated: AuthenticatedGuard
} as const;
