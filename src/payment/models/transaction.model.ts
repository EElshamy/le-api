import { Field, ID, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { Purchase } from '@src/cart/models/purchase.model';
import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  HasMany,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { paginate } from '../../_common/paginator/paginator.service';
import { getColumnEnum } from '../../_common/utils/columnEnum';
import { User } from '../../user/models/user.model';
import { TransactionStatusEnum } from '../enums/transaction-status.enum';
import { TransactionTypeEnum } from '../enums/transaction-targets.enum';
import { PaymentDetails } from '../interfaces/payment-details.interface';
import { LearningProgramRevenueShare } from './revenue-share.model';
import { WalletTransaction } from './wallet-transaction.model';
import { Wallet } from './wallet.model';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';
import { all } from 'axios';
import { TransactionLog } from './transaction-logs.model';

@Table({
  indexes: [
    { name: 'idx_transactions_status', fields: ['status'] },
    { name: 'idx_transactions_createdAt', fields: ['createdAt'] },
    {
      name: 'idx_transactions_status_createdAt',
      fields: ['status', 'createdAt']
    },
    {
      name: 'idx_transactions_user_remote',
      fields: ['userId', 'remoteCheckoutSessionId', 'remoteTransactionId']
    }
  ]
})
@ObjectType()
export class Transaction extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Field({
    nullable: true
  })
  @Column({ type: DataType.STRING, unique: true })
  code: string;

  @Column({ type: DataType.STRING })
  @Field({
    nullable: true
  })
  arTitle: string;

  @Column({ type: DataType.STRING })
  @Field({
    nullable: true
  })
  enTitle: string;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  userId: string;

  @BelongsTo(() => User)
  @Field(() => User)
  user: User;

  @AllowNull(false)
  @ForeignKey(() => Purchase)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  purchaseId: string;

  @BelongsTo(() => Purchase)
  purchase: Purchase;

  @Default(TransactionTypeEnum.PAYMENT)
  @Column(getColumnEnum(TransactionTypeEnum))
  @Field(() => TransactionTypeEnum)
  type: TransactionTypeEnum;

  @Column({ type: DataType.STRING })
  remoteCheckoutSessionId: string;

  @Column({ type: DataType.STRING })
  @Field({ nullable: true })
  remoteTransactionId: string;

  @AllowNull(true)
  @Column({ type: DataType.JSONB })
  @Field(() => PaymentDetails, {
    nullable: true
  })
  paymentDetails: PaymentDetails;

  @HasMany(() => LearningProgramRevenueShare, {
    foreignKey: 'transactionId',
    as: 'revenueShares'
  })
  revenueShares: LearningProgramRevenueShare[];

  @Field(() => MoneyScalar)
  @Column(DataType.INTEGER)
  totalAmount: number;

  @Default(TransactionStatusEnum.PENDING)
  @Column({ type: getColumnEnum(TransactionStatusEnum) })
  @Field(() => TransactionStatusEnum)
  status: TransactionStatusEnum;

  @BelongsToMany(() => Wallet, () => WalletTransaction)
  wallets: Wallet[];

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({
    nullable: true
  })
  enInvoicePath: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({
    nullable: true
  })
  arInvoicePath: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  @Field({
    nullable: true
  })
  failureReason: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  tempMetaData: {
    couponId?: string;
    resetCart?: boolean;
  };

  @HasMany(() => TransactionLog, {
    foreignKey: 'transactionId',
    as: 'logs'
  })
  @Field(() => [TransactionLog], {   nullable: true })
  logs: TransactionLog[];

  @Column({ type: DataType.FLOAT, defaultValue: 2 })
  @Field(() => Number)
  vat: number;

  @Column({ type: DataType.FLOAT, defaultValue: 14 })
  @Field(() => Number)
  gatewayVat: number;

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Timestamp)
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Timestamp)
  updatedAt: Date;

  @Default(null)
  @DeletedAt
  @Column({ type: DataType.DATE })
  @Field(() => Timestamp, { nullable: true })
  deletedAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include?: Includeable[],
    attributes?: FindAttributeOptions,
    isNestAndRaw?: boolean,
    subQuery?: boolean,
    group?: GroupOption,
    distinct: boolean = true
  ): Promise<PaginationRes<Transaction>> {
    return paginate<Transaction>(
      this,
      filter,
      sort,
      page,
      limit,
      include,
      attributes,
      isNestAndRaw,
      subQuery,
      group,
      distinct
    );
  }
}
