import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { paginate } from '@src/_common/paginator/paginator.service';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { User } from '@src/user/models/user.model';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
import {
  TransactionStateChangeEnum,
  TransactionStatusEnum
} from '../enums/transaction-status.enum';
import { Transaction } from './transaction.model';

@ObjectType()
@Table
export class TransactionLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number;

  @AllowNull(true)
  @ForeignKey(() => Transaction)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  transactionId: string;

  @BelongsTo(() => Transaction)
  transaction: Transaction;

  @ForeignKey(() => User)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  userId: string;

  @BelongsTo(() => User)
  @Field(() => User)
  user: User;

  @Default(TransactionStatusEnum.PENDING)
  @Column({ type: getColumnEnum(TransactionStatusEnum) })
  @Field(() => TransactionStatusEnum)
  status: TransactionStatusEnum;

  @Default(TransactionStateChangeEnum.TRANSACTION_CREATED)
  @Column({ type: getColumnEnum(TransactionStateChangeEnum) })
  @Field(() => TransactionStateChangeEnum)
  change: TransactionStateChangeEnum;

  @CreatedAt
  @Field(() => Timestamp)
  createdAt?: Date | number;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include = []
  ): Promise<PaginationRes<TransactionLog>> {
    return paginate<TransactionLog>(this, filter, sort, page, limit, include);
  }
}
