import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { Transaction } from '../models/transaction.model';

export const GqlTransactionResponse = generateGqlResponseType(Transaction);
export const GqlTransactionsPaginatedResponse = generateGqlResponseType(
  Array(Transaction)
);
export const GqlTransactionsResponse = generateGqlResponseType(
  Array(Transaction),
  true
);
