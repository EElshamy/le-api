import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { IsEnum, IsString } from 'class-validator';
import { TransactionLogSortEnum } from '../enums/transaction-log.enums';
import {
  TransactionStateChangeEnum,
  TransactionStatusEnum
} from '../enums/transaction-status.enum';

@InputType()
export class TransactionLogsFilterInput {
  @IsString()
  @Field({ nullable: true })
  searchKey?: string;

  @IsString()
  @Field({ nullable: true })
  transactionId?: string;

  @IsEnum(TransactionStatusEnum)
  @Field(() => TransactionStatusEnum, { nullable: true })
  status?: TransactionStatusEnum;

  @IsEnum(TransactionStateChangeEnum)
  @Field(() => TransactionStateChangeEnum, { nullable: true })
  change?: TransactionStateChangeEnum;

  @IsString()
  @Field({ nullable: true })
  userId?: string;
}

@InputType()
export class TransactionLogSortInput {
  @Field(() => TransactionLogSortEnum)
  sortBy?: TransactionLogSortEnum;

  @Field(() => SortTypeEnum)
  sortType?: SortTypeEnum;
}

@ArgsType()
export class TransactionLogsFilterArgs {
  @Field(() => TransactionLogsFilterInput)
  filter?: TransactionLogsFilterInput;
}

@ArgsType()
export class TransactionLogsSortArgs {
  @Field(() => TransactionLogSortInput)
  sort?: TransactionLogSortInput;
}
