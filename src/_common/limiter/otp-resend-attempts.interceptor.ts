import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  mixin,
  Type,
  Inject
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { BaseHttpException } from '../exceptions/base-http-exception';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';
import { LimitingTypeEnum, ValidationMethodEnum } from './limiter.enum';
import { LimiterService } from './limiter.service';
import { GqlContext } from '../graphql/graphql-context.type';

export const OtpResendLimiterInterceptor = (
  validationMethod: ValidationMethodEnum
): Type<NestInterceptor> => {
  class ResendOtpLimiter implements NestInterceptor {
    constructor(@Inject(LimiterService) private readonly limiterService: LimiterService) {}

    private resendOtpLimiter = this.limiterService.createLimiter({
      limitType: LimitingTypeEnum.OTP_RESEND,
      limitDurationInMin: 5,
      maxRequestNoPerInterval: 4,
      minIntervalBetweenRequestsInSeconds: 10
    });

    //limit actions for successful operation only
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      let key = context.getArgByIndex(1)['input'][validationMethod].toLowerCase();
      // const ipAddress = (<GqlContext>context.getArgByIndex(2)).ipAddress;
      // key = `${key}-${ipAddress}`;

      const resendOtpLimit = await this.resendOtpLimiter.wouldLimitWithInfo(key);

      console.log({ key, resendOtpLimit });

      if (resendOtpLimit.blockedDueToCount)
        throw new BaseHttpException(ErrorCodeEnum.OTP_RESEND_LIMIT);

      if (resendOtpLimit.blockedDueToMinDifference)
        throw new BaseHttpException(ErrorCodeEnum.SLOW_DOWN);

      return (
        !resendOtpLimit.blocked &&
        next.handle().pipe(
          map(res => {
            if (res) this.resendOtpLimiter.limit(key);
            return res;
          })
        )
      );
    }
  }
  return mixin(ResendOtpLimiter);
};
