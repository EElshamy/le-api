import { Field, ObjectType } from '@nestjs/graphql';
import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';

export interface IPaymentLinkResponse {
  paymentLink: string;
}

@ObjectType()
export class TransactionStatusChangeResponse {
  @Field()
  status: string;
}

export const GqlTransactionStatusChangeResponse = generateGqlResponseType(
  TransactionStatusChangeResponse
);
