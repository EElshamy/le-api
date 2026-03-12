import { registerEnumType } from '@nestjs/graphql';

export enum TransactionStatusEnum {
  PENDING = 'PENDING',
  REFUNDED = 'REFUNDED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED'
}
registerEnumType(TransactionStatusEnum, {
  name: 'TransactionStatusEnum'
});

export enum CustomTransactionStatusFilterEnum {
  REFUNDED = 'REFUNDED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED'
}
registerEnumType(CustomTransactionStatusFilterEnum, {
  name: 'CustomTransactionStatusFilterEnum'
});

export enum AllowedExplicitTransactionStatusChangesEnum {
  REFUNDED = 'REFUNDED',
  CANCELED = 'CANCELED'
}

registerEnumType(AllowedExplicitTransactionStatusChangesEnum, {
  name: 'AllowedExplicitTransactionStatusChangesEnum'
});

export enum TransactionStateChangeEnum {
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_FULFILLED = 'TRANSACTION_FULFILLED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_EXPIRED = 'TRANSACTION_EXPIRED',
  REFUND_USER = 'REFUND_USER',
  CANCEL_PAYOUT = 'CANCEL_PAYOUT',
  CONFIRM_PAYOUT = 'CONFIRM_PAYOUT'
}
registerEnumType(TransactionStateChangeEnum, {
  name: 'TransactionStateChangeEnum'
});
