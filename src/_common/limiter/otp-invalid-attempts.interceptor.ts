import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  mixin,
  Type,
  Inject
} from '@nestjs/common';
import { catchError, map, Observable } from 'rxjs';
import { BaseHttpException } from '../exceptions/base-http-exception';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';
import { LimitingTypeEnum, ValidationMethodEnum } from './limiter.enum';
import { LimiterService } from './limiter.service';
import { GqlContext } from '../graphql/graphql-context.type';

export const OtpInvalidAttemptsLimiterInterceptor = (
  validationMethod: ValidationMethodEnum
): Type<NestInterceptor> => {
  class OtpInvalidAttemptsLimiter implements NestInterceptor {
    constructor(@Inject(LimiterService) private readonly limiterService: LimiterService) {}

    private invalidOtpAttemptsLimiter = this.limiterService.createLimiter({
      limitType: LimitingTypeEnum.OTP_RESEND,
      limitDurationInMin: 5,
      maxRequestNoPerInterval: 4,
      minIntervalBetweenRequestsInSeconds: 0
    });

    //limit actions for failed attempts
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      let key = context.getArgByIndex(1)['input'][validationMethod].toLowerCase();
      const ipAddress = (<GqlContext>context.getArgByIndex(2)).ipAddress;
      key = `${key}-${ipAddress}`;

      const invalidOtpAttemptsLimit = await this.invalidOtpAttemptsLimiter.wouldLimitWithInfo(key);

      if (invalidOtpAttemptsLimit.blockedDueToCount)
        throw new BaseHttpException(ErrorCodeEnum.OTP_ENTERING_ATTEMPTS_LIMIT);

      return (
        !invalidOtpAttemptsLimit.blocked &&
        next.handle().pipe(
          catchError(async err => {
            if (err.status === ErrorCodeEnum.INVALID_VERIFICATION_CODE) {
              this.invalidOtpAttemptsLimiter.limit(key);
            }
            throw new BaseHttpException(ErrorCodeEnum[err.response] as unknown as ErrorCodeEnum);
          }),
          map(res => {
            if (res) this.invalidOtpAttemptsLimiter.clear(key);
            return res;
          })
        )
      );
    }
  }
  return mixin(OtpInvalidAttemptsLimiter);
};
