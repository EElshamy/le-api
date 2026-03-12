import { registerEnumType } from '@nestjs/graphql';

export enum TransactionLogSortEnum {
  CREATED_AT = 'createdAt',
  TOTAL_AMOUNT = 'totalAmount'
}
registerEnumType(TransactionLogSortEnum, { name: 'TransactionLogSortEnum' });
