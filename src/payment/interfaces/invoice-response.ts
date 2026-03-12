import { Field, ObjectType } from '@nestjs/graphql';
import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
@ObjectType()
export class InvoiceItem {
  @Field()
  type: string;
  @Field()
  enName: string;
  @Field()
  arName: string;
  @Field(() => MoneyScalar)
  price: number;
  @Field(() => MoneyScalar)
  tax: number;
  @Field(() => MoneyScalar)
  amountPaid: number;
  @Field(() => String, { nullable: true })
  discountCode?: string;
}
@ObjectType()
export class Invoice {
  transactionId: string;
  @Field()
  enProvidedTo: string;
  @Field()
  arProvidedTo: string;
  @Field()
  invoiceDate: string;
  @Field()
  invoiceNumber: string;
  @Field({ nullable: true })
  couponCode: string;
  @Field(() => [InvoiceItem])
  invoiceItems: InvoiceItem[];
  @Field(() => MoneyScalar)
  totalAmountPaid: number;
}
export const GqlInvoiceResponse = generateGqlResponseType(Invoice);
