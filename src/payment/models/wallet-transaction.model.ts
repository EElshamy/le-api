import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table
} from 'sequelize-typescript';
import { Transaction } from './transaction.model';
import { Wallet } from './wallet.model';

@Table({ timestamps: false })
export class WalletTransaction extends Model {
  @AllowNull(false)
  @ForeignKey(() => Wallet)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  walletId: string;

  @BelongsTo(() => Wallet, 'walletId')
  wallet: Wallet;

  @ForeignKey(() => Transaction)
  @AllowNull(false)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  transactionId: string;

  @BelongsTo(() => Transaction, 'transactionId')
  transaction: Transaction;
}
