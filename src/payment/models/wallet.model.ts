import { Field, ID, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import {
  AllowNull,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { paginate } from '../../_common/paginator/paginator.service';
import { getColumnEnum } from '../../_common/utils/columnEnum';
import {
  WalletOwnerTypeEnum,
  WalletStatusEnum,
  WalletTypeEnum
} from '../enums/wallets.enums';
import { Transaction } from './transaction.model';
import { WalletTransaction } from './wallet-transaction.model';

@Table
@ObjectType()
export class Wallet extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @AllowNull(true)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  ownerId: string;

  @Default(WalletOwnerTypeEnum.LECTURER)
  @Column(getColumnEnum(WalletOwnerTypeEnum))
  @Field(() => WalletOwnerTypeEnum)
  ownerType: WalletOwnerTypeEnum;

  @BelongsToMany(() => Transaction, () => WalletTransaction)
  transactions: Transaction[];

  @Default(WalletTypeEnum.SYS_WALLET)
  @Column(getColumnEnum(WalletTypeEnum))
  @Field(() => WalletTypeEnum)
  type: WalletTypeEnum;

  @Default(WalletStatusEnum.INACTIVE)
  @Column(getColumnEnum(WalletStatusEnum))
  @Field(() => WalletStatusEnum)
  status: WalletStatusEnum;

  @Field(() => MoneyScalar)
  @Column(DataType.INTEGER)
  balance: number;

  @CreatedAt
  @Field(() => Timestamp)
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Field(() => Timestamp)
  @Column({ type: DataType.DATE })
  updatedAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include = []
  ): Promise<PaginationRes<Wallet>> {
    return paginate<Wallet>(this, filter, sort, page, limit, include);
  }
}
