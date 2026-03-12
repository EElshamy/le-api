import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppCheckService } from '../services/app-check.service';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';

@Injectable()
export class AppCheckGuard implements CanActivate {
  constructor(private readonly appCheckService: AppCheckService) {}
  private getRequest(context: ExecutionContext) {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      return request;
    }
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    return request;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context) as Request;

    const token = request.headers['x-firebase-appcheck'];

    if (!token) {
      throw new BaseHttpException(ErrorCodeEnum.APP_CHECK_TOKEN_NOT_FOUND);
    }

    await this.appCheckService.validateToken(token as string);

    return true;
  }
}
