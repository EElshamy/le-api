import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ApplyCouponType {
  @Field()
  discountAmount: number;
  itemDiscountShare?: { [key: string]: number };
}
