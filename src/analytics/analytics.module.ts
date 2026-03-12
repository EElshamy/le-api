import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';
import { PaymentModule } from '@src/payment/payment.module';

@Module({
  imports:[
    PaymentModule
  ],
  providers: [AnalyticsResolver, AnalyticsService],
})
export class AnalyticsModule {}
