import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaymentIntentResponse {
  @Field(() => String, { nullable: true })
  paymentIntentId?: string;
  
  @Field(() => String, { nullable: true })
  paymentIntentSecretKey?: string;

  @Field(() => String, { nullable: true })
  paymentLink?: string;

  @Field(() => String, { nullable: true })
  transactionCode?: string;
}
