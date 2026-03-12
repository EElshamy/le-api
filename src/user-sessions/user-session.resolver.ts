import { Context, Mutation, Resolver } from '@nestjs/graphql';
import { UserSession } from './user-sessions.model';
import { UseGuards } from '@nestjs/common';
import { GqlBooleanResponse } from '../_common/graphql/graphql-response.type';
import { AuthGuard } from '../auth/auth.guard';
import { UserSessionService } from './user-sessions.service';
import { GqlContext } from '../_common/graphql/graphql-context.type';

@UseGuards(AuthGuard)
@Resolver(() => UserSession)
export class UserSessionResolver {
  constructor(private readonly userSessionService: UserSessionService) {}

  // @Mutation(returns => GqlBooleanResponse)
  // async logout(@Context() { sessionId }: GqlContext) {
  //   return await this.userSessionService.deactivateUserSession(sessionId);
  // }

  @Mutation(returns => GqlBooleanResponse)
  async logoutOfOtherSessions(
    @Context() { currentUser, sessionId }: GqlContext
  ) {
    return await this.userSessionService.deactivateUserSessions(
      currentUser.id,
      sessionId
    );
  }
}
