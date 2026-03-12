import { Field, ID, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { paginate } from '../../_common/paginator/paginator.service';
import { Transaction } from './transaction.model';

@Table({
  indexes: [
    { name: 'idx_lprs_createdAt', fields: ['createdAt'] },
    { name: 'idx_lprs_transactionId', fields: ['transactionId'] },
    { name: 'idx_lprs_createdAt_transactionId', fields: ['createdAt', 'transactionId'] }
  ]
})
@ObjectType()
export class LearningProgramRevenueShare extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @AllowNull(false)
  @ForeignKey(() => Transaction)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  transactionId: string;

  @BelongsTo(() => Transaction)
  @Field(() => Transaction)
  transaction: Transaction;

  @Column({ onDelete: 'set null', type: DataType.UUID })
  @Field(() => String)
  programId: string;

  @Default(LearningProgramTypeEnum.COURSE)
  @Column(getColumnEnum(LearningProgramTypeEnum))
  @Field(() => LearningProgramTypeEnum)
  programType: LearningProgramTypeEnum;

  @Column({ onDelete: 'set null', type: DataType.UUID })
  @Field(() => String)
  parentId: string;

  @Default(LearningProgramTypeEnum.COURSE)
  @Column(getColumnEnum(LearningProgramTypeEnum))
  @Field(() => LearningProgramTypeEnum)
  parentType: LearningProgramTypeEnum;

  @Field(() => MoneyScalar)
  @Column(DataType.INTEGER)
  totalAmount: number;

  @Field(() => MoneyScalar)
  @Column(DataType.INTEGER)
  systemShare: number;

  @Field(() => MoneyScalar)
  @Column(DataType.INTEGER)
  lecturerShare: number;

  @ForeignKey(() => Lecturer)
  @Column({ onDelete: 'set null', type: DataType.UUID })
  lecturerId: string;

  @BelongsTo(() => Lecturer)
  @Field(() => Lecturer)
  lecturer: Lecturer;

  @Default(14)
  @Field(() => MoneyScalar)
  @Column(DataType.FLOAT)
  vatAmount: number;

  @Default(0)
  @Field(() => MoneyScalar)
  @Column(DataType.FLOAT)
  paymentGateWayVatAmount: number;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include = []
  ): Promise<PaginationRes<LearningProgramRevenueShare>> {
    return paginate<LearningProgramRevenueShare>(
      this,
      filter,
      sort,
      page,
      limit,
      include
    );
  }
}
