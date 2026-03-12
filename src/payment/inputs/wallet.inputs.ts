import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { Min } from 'class-validator';
import {
  PayoutWalletTypeEnum,
  WalletOwnerTypeEnum,
  WalletSortEnum,
  WalletStatusEnum,
  WalletTypeEnum
} from '../enums/wallets.enums';

@InputType()
export class BalanceFilter {
  @Min(1)
  @Field(() => MoneyScalar, { nullable: true })
  from?: number;

  @Min(1)
  @Field(() => MoneyScalar, { nullable: true })
  to?: number;
}

@InputType()
export class OwnerFilter {
  @Field({
    nullable: true
  })
  id: string;

  @Field(() => WalletOwnerTypeEnum)
  type: WalletOwnerTypeEnum;
}

@InputType()
export class WalletFilterInput {
  @Field({ nullable: true })
  searchKey?: string;

  @Field(() => OwnerFilter, { nullable: true })
  owner?: OwnerFilter;

  @Field(() => WalletTypeEnum, { nullable: true })
  type?: WalletTypeEnum;

  @Field(() => BalanceFilter, { nullable: true })
  balance?: BalanceFilter;

  @Field(() => WalletStatusEnum, { nullable: true })
  status?: WalletStatusEnum;
}

@ArgsType()
export class WalletsFilterArg {
  @Field({ nullable: true })
  filter?: WalletFilterInput;
}

@InputType()
export class LecturersWalletFilterInput {
  @Field({ nullable: true })
  searchKey?: string;

  @Field(() => OwnerFilter, { nullable: true })
  owner?: OwnerFilter;

  @Field(() => WalletTypeEnum, { nullable: true })
  type?: WalletTypeEnum;

  @Field(() => BalanceFilter, { nullable: true })
  balance?: BalanceFilter;

  @Field(() => WalletStatusEnum, { nullable: true })
  status?: WalletStatusEnum;
}

@ArgsType()
export class LecturersWalletsFilterArg {
  @Field({ nullable: true })
  filter?: LecturersWalletFilterInput;
}

@InputType()
export class PayoutWalletFilterInput {
  @Field({ nullable: true })
  searchKey?: string;
  @Field({ nullable: true })
  searchKeyForLecturer?: string;

  @Field(() => OwnerFilter, { nullable: true })
  owner?: OwnerFilter;

  @Field(() => PayoutWalletTypeEnum , { nullable: true })
  type?: PayoutWalletTypeEnum;

  @Field(() => BalanceFilter, { nullable: true })
  balance?: BalanceFilter;

  @Field(() => WalletStatusEnum, { nullable: true })
  status?: WalletStatusEnum;
}

@ArgsType()
export class PayoutWalletsFilterArg {
  @Field({ nullable: true })
  filter?: PayoutWalletFilterInput;
}

@InputType()
export class WalletSortInput {
  @Field(() => WalletSortEnum)
  sortBy?: WalletSortEnum;

  @Field(() => SortTypeEnum)
  sortType?: SortTypeEnum;
}

@ArgsType()
export class WalletSortArg {
  @Field(() => WalletSortInput)
  sort?: WalletSortInput;
}
