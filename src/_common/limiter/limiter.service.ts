import { Injectable } from '@nestjs/common';
import IORedis from 'ioredis';
import { RedisRateLimiter } from 'rolling-rate-limiter';
import { env } from '../utils/env';
import { LimitingTypeEnum } from './limiter.enum';

@Injectable()
export class LimiterService {
  private redisClient = new IORedis({
    host: env.REDIS_HOST,
    port: +env.REDIS_PORT,
    password: env.REDIS_PASS,
    ...(env.REDIS_DATABASE_INDEX !== undefined && { db: +env.REDIS_DATABASE_INDEX })
  });

  // constructor() {
  //   // Prevent MaxListenersExceededWarning on internal ioredis Commander
  //   this.redisClient.setMaxListeners(1000);
  // }

  createLimiter(input: {
    limitType: LimitingTypeEnum;
    limitDurationInMin: number;
    maxRequestNoPerInterval: number;
    minIntervalBetweenRequestsInSeconds: number;
  }): RedisRateLimiter {
    return new RedisRateLimiter({
      client: this.redisClient,
      namespace: input.limitType,
      interval: input.limitDurationInMin * 60 * 1000,
      maxInInterval: input.maxRequestNoPerInterval,
      minDifference: input.minIntervalBetweenRequestsInSeconds * 1000
    });
  }
}
