import { Field, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';

@ObjectType()
export class WalletData {
  @Field(() => MoneyScalar)
  pendingBalance: number;

  @Field(() => MoneyScalar)
  availableBalance: number;

  @Field(() => MoneyScalar)
  pendingPayoutBalance: number;

  @Field(() => MoneyScalar)
  withdrawnBalance: number;
}

@ObjectType()
export class AllWalletsBalanceCombined {
  @Field(() => MoneyScalar)
  VAT_WALLET: number;

  @Field(() => MoneyScalar)
  SYS_WALLET: number;

  @Field(() => MoneyScalar)
  LECTURER_WALLET: number;

  @Field(() => MoneyScalar)
  PENDING_LECTURER_WALLET: number;

  @Field(() => MoneyScalar)
  STRIP_WALLET: number;

  @Field(() => MoneyScalar)
  PENDING_PAYOUT_WALLET: number;

  @Field(() => MoneyScalar)
  SUCCESS_PAYOUT_WALLET: number;
}
