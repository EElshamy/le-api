import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { Coupon } from '../models/coupons.model';

export const GqlCouponResponse = generateGqlResponseType(Coupon);
export const GqlCouponsPaginatedResponse = generateGqlResponseType(
  Array(Coupon)
);
export const GqlCouponsResponse = generateGqlResponseType(Array(Coupon), true);
