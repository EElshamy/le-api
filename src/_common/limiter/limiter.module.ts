import { Module } from '@nestjs/common';
import { LimiterService } from './limiter.service';

@Module({
  providers: [LimiterService],
  exports: [LimiterService]
})
export class LimiterModule {}
