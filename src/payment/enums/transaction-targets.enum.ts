import { registerEnumType } from '@nestjs/graphql';

export enum TransactionTypeEnum {
  REFUND = 'Refund',
  PAYMENT = 'Payment',
  PAYOUT = 'Payout'
}

registerEnumType(TransactionTypeEnum, {
  name: 'TransactionTypeEnum'
});

export enum TransactionSortEnum {
  CREATED_AT = 'createdAt',
  totalAmount = 'totalAmount'
}
registerEnumType(TransactionSortEnum, { name: 'TransactionSortEnum' });

export enum TransactionCardBrandEnum {
  VISA = 'Visa',
  MASTERCARD = 'MasterCard',
  AMEX = 'Amex',
  DINERS = 'Diners',
  DISCOVER = 'Discover',
  EFTPOS_AU = 'Eftpos_au',
  JCB = 'JCB',
  LINK = 'Link',
  UNIONPAY = 'UnionPay',
  FREE_COUPON = 'FREE_COUPON',
  FREE = 'FREE',
  MEEZA = 'MeezaDigital',
  UNKNOWN = 'Unknown'
}
// amex, diners, discover, eftpos_au, jcb, link, mastercard, unionpay, visa, unknown
registerEnumType(TransactionCardBrandEnum, {
  name: 'TransactionCardBrandEnum'
});
