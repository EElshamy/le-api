import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { TransactionLog } from '../models/transaction-logs.model';

export const GqlTransactionLogResponse =
  generateGqlResponseType(TransactionLog);
export const GqlTransactionLogsPaginatedResponse = generateGqlResponseType(
  Array(TransactionLog)
);
export const GqlTransactionLogsResponse = generateGqlResponseType(
  Array(TransactionLog),
  true
);
