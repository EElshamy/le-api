import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { LangEnum } from '@src/user/user.enum';
import { IsOptional } from 'class-validator';
import {
  AllowedExplicitTransactionStatusChangesEnum,
  CustomTransactionStatusFilterEnum
} from '../enums/transaction-status.enum';
import {
  TransactionSortEnum,
  TransactionTypeEnum
} from '../enums/transaction-targets.enum';

@InputType()
export class TotalAmountFilter {
  @Field(() => MoneyScalar, { nullable: true })
  from?: number;

  @Field(() => MoneyScalar, { nullable: true })
  to?: number;
}

@InputType()
export class DateRangeFilter {
  @Field(() => Timestamp, { nullable: true })
  from?: Date;

  @Field(() => Timestamp, { nullable: true })
  to?: Date;
}

@InputType()
export class TransactionFilterForAdminInput {
  @Field({ nullable: true , description:"search by transaction (code or title), user (name or code), lecturer (name or code) " })
  searchKey?: string;

  // @Field({ nullable: true })
  // searchKeyForUser?: string;

  // @Field({ nullable: true })
  // searchKeyForLecturer?: string;

  @Field({ nullable: true })
  userId?: string;

  // @Field({ nullable: true })
  // code?: string;

  @Field(() => TransactionTypeEnum, { nullable: true })
  type?: TransactionTypeEnum;

  @Field({ nullable: true })
  lecturerId?: string;

  @Field(() => TotalAmountFilter, { nullable: true })
  totalAmountFilter?: TotalAmountFilter;

  @Field(() => CustomTransactionStatusFilterEnum, { nullable: true })
  status?: CustomTransactionStatusFilterEnum;
}

@ArgsType()
export class TransactionsFilterForAdminArg {
  @Field({ nullable: true })
  filter?: TransactionFilterForAdminInput;
}

@InputType()
export class TransactionFilterForLecturerInput {
  @Field({ nullable: true })
  searchKey?: string;

  @Field({ nullable: true })
  searchKeyForUser?: string;

  @Field(() => String, { nullable: true })
  transactionId?: string;

  @Field(() => TransactionTypeEnum, { nullable: true })
  type?: TransactionTypeEnum;

  @Field(() => CustomTransactionStatusFilterEnum, { nullable: true })
  status?: CustomTransactionStatusFilterEnum;

  @Field(() => TotalAmountFilter, { nullable: true })
  totalAmountFilter?: TotalAmountFilter;

  @Field(() => DateRangeFilter, { nullable: true })
  dateRange?: DateRangeFilter;
}

@ArgsType()
export class TransactionsFilterForLecturerArg {
  @Field({ nullable: true })
  filter?: TransactionFilterForLecturerInput;
}

@InputType()
export class TransactionFilterForUserInput {
  @Field({ nullable: true })
  searchKey?: string;
}

@ArgsType()
export class TransactionsFilterForUserArg {
  @Field({ nullable: true })
  filter?: TransactionFilterForUserInput;
}

@InputType()
export class TransactionSortInput {
  @Field(() => TransactionSortEnum)
  sortBy?: TransactionSortEnum;

  @Field(() => SortTypeEnum)
  sortType?: SortTypeEnum;
}

@ArgsType()
export class TransactionSortArg {
  @IsOptional()
  @Field(() => TransactionSortInput, { nullable: true })
  sort?: TransactionSortInput;
}

@InputType()
export class TransactionInvoiceDownloadInput {
  @Field(() => String)
  transactionId: string;

  @Field(() => LangEnum)
  lang: LangEnum;
}

@InputType()
export class UpdateTransactionStatusInput {
  @Field(() => String)
  transactionId: string;

  @Field(() => AllowedExplicitTransactionStatusChangesEnum)
  status: AllowedExplicitTransactionStatusChangesEnum;
}
