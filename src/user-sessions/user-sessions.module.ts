import { Module } from '@nestjs/common';
import { UserSessionService } from './user-sessions.service';
import { UserSessionResolver } from './user-session.resolver';

@Module({ providers: [UserSessionService, UserSessionResolver], exports: [UserSessionService] })
export class UserSessionModule {}
