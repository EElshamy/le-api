import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (fieldName, ctx: ExecutionContext) => {
    const gqlCtx = GqlExecutionContext.create(ctx);

    const { currentUser } = gqlCtx.getContext();

    if (!currentUser) return null;

    if (fieldName) return currentUser[fieldName];

    return currentUser;
  }
);

export const getCurrentUserSessionId = createParamDecorator(
  (fieldName, ctx: ExecutionContext) => {
    const gqlCtx = GqlExecutionContext.create(ctx);

    const { sessionId } = gqlCtx.getContext();

    if (!sessionId) return null;

    return sessionId;
  }
);
