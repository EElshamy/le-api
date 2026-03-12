import { Field, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';

@ObjectType()
export class GetCartCalcsOutput {
  @Field(() => MoneyScalar)
  totalPrice: number;
  @Field()
  discountAmount: number;
  @Field()
  priceAfterDiscount: number;
  @Field()
  vat: number;
  @Field()
  vatAmount: number;
  @Field()
  netPrice: number;
}
