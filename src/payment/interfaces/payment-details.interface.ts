import { Field, ObjectType } from '@nestjs/graphql';
import { TransactionCardBrandEnum } from '../enums/transaction-targets.enum';

@ObjectType()
export class AddressBillingDetails {
  @Field({ nullable: true })
  city: string;

  @Field({ nullable: true })
  state: string;

  @Field({ nullable: true })
  zip: string;

  @Field({ nullable: true })
  country: string;
}

@ObjectType()
export class BillingDetails {
  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  email: string;

  @Field({ nullable: true })
  phone: string;

  @Field(() => AddressBillingDetails)
  address: AddressBillingDetails;
}

@ObjectType()
export class PaymentDetails {
  @Field(() => BillingDetails, { nullable: true })
  billingDetails: BillingDetails;

  @Field({ nullable: true })
  last4: string;

  @Field(() => TransactionCardBrandEnum, { nullable: true })
  cardBrand: TransactionCardBrandEnum;
}
