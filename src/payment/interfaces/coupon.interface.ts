import { Field, ObjectType } from '@nestjs/graphql';
import { CouponDiscountTypeEnum } from '../enums/coupon.enums';

export interface ICoupon {
  code: string;
  remoteCouponId: string;
  discountOff: number;
  discountType: CouponDiscountTypeEnum;
  remoteApplicableFor: string[]; // coupon applicable for which products
  redeemableCount: number;
  endDate: Date;
  redeemableOnce: boolean;
  minimumAmount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@ObjectType()
export class ApplicableForMetadata {
  @Field({ nullable: true })
  id: string;
  @Field({ nullable: true })
  type: string;
  @Field({ nullable: true })
  enTitle: string;
  @Field({ nullable: true })
  arTitle: string;
  @Field({ nullable: true })
  image: string;
  @Field({ nullable: true })
  slug: string;
}

export interface IApplicabilityCriteriaResults {
  remoteApplicableFor: string[];
  applicableForMetadata: ApplicableForMetadata[];
}
