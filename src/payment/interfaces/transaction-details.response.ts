import { Field, ObjectType } from '@nestjs/graphql';
import { TransactionStatusEnum } from '../enums/transaction-status.enum';
import { PaymentDetails } from './payment-details.interface';
import { LearningProgram } from '@src/cart/types/learning-program.type';
import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { PurchaseItem } from '@src/cart/models/purchase-item.model';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';

@ObjectType()
export class TransactionDetails {
  @Field({
    nullable: true
  })
  code: string;

  @Field(() => TransactionStatusEnum)
  status: TransactionStatusEnum;

  @Field(() => PaymentDetails, {
    nullable: true
  })
  paymentDetails: PaymentDetails;

  @Field(() => [PurchaseItem], {
    nullable: true // how could it be nullable??
  })
  purchaseItems: PurchaseItem[];

  @Field()
  totalPrice: number;

  @Field()
  discountAmount: number;

  @Field()
  totalPriceAfterDiscount: number;

  @Field()
  vat: number;

  @Field()
  vatAmount: number;

  @Field()
  netPrice: number;

  @Field(() => Timestamp)
  orderDate: Date;
}

export const GqlTransactionDetailsResponse =
  generateGqlResponseType(TransactionDetails);
