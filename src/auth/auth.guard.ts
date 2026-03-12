import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlContext } from '@src/_common/graphql/graphql-context.type';
import { FileModelEnum } from '@src/_common/uploader/file.enum';
import {
  IContextAuthService,
  IContextAuthServiceToken
} from '../_common/context/context-auth.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  allowTemporaryToken: boolean;

  constructor(
    @Inject(IContextAuthServiceToken)
    private readonly authService: IContextAuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const handlerName = ctx.getHandler().name;
    const { currentUser, sessionId, isTempToken } =
      ctx.getContext() as GqlContext;
    // console.log('currentSessionId : ', sessionId);
    const uploadModel = ctx.getArgs()?.input?.model as
      | FileModelEnum
      | undefined;
    //TODO: temporary make uploading Lecturer_CV_FILE without guard
    if (uploadModel && uploadModel === FileModelEnum.LECTURER_CV_FILE)
      return true;
    await this.authService.isUserAllowedToContinue({
      currentUser,
      currentSessionId: sessionId,
      isTempToken,
      context,
      allowTemporaryToken: this.allowTemporaryToken,
      handlerName
    });

    return true;
  }
}
