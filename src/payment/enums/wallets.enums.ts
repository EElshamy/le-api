import { registerEnumType } from '@nestjs/graphql';

export enum WalletOwnerTypeEnum {
  LECTURER = 'Lecturer',
  SYSTEM = 'SYSTEM'
}

registerEnumType(WalletOwnerTypeEnum, {
  name: 'WalletOwnerTypeEnum'
});

export enum WalletTypeEnum {
  VAT_WALLET = 'VAT_WALLET',
  PAYMENT_GATEWAY_VAT_WALLET = 'PAYMENT_GATEWAY_VAT_WALLET',  
  SYS_WALLET = 'SYS_WALLET ',
  LECTURER_WALLET = 'LECTURER_WALLET',
  PENDING_LECTURER_WALLET = 'PENDING_LECTURER_WALLET',
  STRIP_WALLET = 'STRIP_WALLET',
  PENDING_PAYOUT_WALLET = 'PENDING_PAYOUT_WALLET',
  SUCCESS_PAYOUT_WALLET = 'SUCCESS_PAYOUT_WALLET'
}
registerEnumType(WalletTypeEnum, {
  name: 'WalletTypeEnum'
});

export enum LecturerWalletTypeEnum {
  LECTURER_WALLET = 'LECTURER_WALLET',
  PENDING_LECTURER_WALLET = 'PENDING_LECTURER_WALLET'
}
registerEnumType(LecturerWalletTypeEnum, {
  name: 'LecturerWalletTypeEnum'
});

export enum PayoutWalletTypeEnum {
  PENDING_PAYOUT_WALLET = 'PENDING_PAYOUT_WALLET',
  SUCCESS_PAYOUT_WALLET = 'SUCCESS_PAYOUT_WALLET'
}
registerEnumType(PayoutWalletTypeEnum, {
  name: 'PayoutWalletTypeEnum'
});

export enum SingletonWalletTypeEnum {
  VAT_WALLET = 'VAT',
  SYS_WALLET = 'SYS_WALLET ',
  STRIP_WALLET = 'STRIP_WALLET'
}

export enum WalletStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}
registerEnumType(WalletStatusEnum, {
  name: 'WalletStatusEnum'
});

export enum WalletSortEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  BALANCE = 'balance'
}
registerEnumType(WalletSortEnum, { name: 'WalletSortEnum' });
