import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CouponService } from '../services/coupon.service';

@Injectable()
export class CouponsCron {
  constructor(private readonly couponService: CouponService) {}
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // @Cron('*/1 * * * *')
  async handleRemoteCouponsCron(): Promise<void> {
    await this.couponService.updateCouponsApplicability();
    await this.couponService.createRemoteCoupons();
  }
}
