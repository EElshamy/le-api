import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { ContentLevelEnum } from '@src/course/enums/course.enum';
import { ProductInfo } from '@src/payment/interfaces/product-info.object';
import {
  IProductInfo,
  IPurchasable
} from '@src/payment/interfaces/product-line.interface';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
import { LearningProgramTypeEnum } from '../enums/cart.enums';
import { Purchase } from './purchase.model';

@Table
@ObjectType()
export class PurchaseItem extends Model implements IPurchasable {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @ForeignKey(() => Purchase)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  purchaseId: string;

  @BelongsTo(() => Purchase)
  @Field(() => Purchase)
  purchase: Purchase;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  @Field(() => MoneyScalar, { nullable: true })
  originalPrice: number;

  //todo .. change it to allowNull: falses
  @Field(() => [ProductInfo], { nullable: true })
  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  productInfo: IProductInfo[];

  @Column
  isFullPurchase: boolean;

  @Default(0)
  @Column
  @Field(() => Int)
  quantity: number;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  @Field(() => MoneyScalar, { nullable: true })
  priceAfterDiscount: number;

  @Column
  @Field()
  learningProgramId: string;

  @Column(getColumnEnum(LearningProgramTypeEnum))
  @Field(() => LearningProgramTypeEnum, { nullable: true })
  type: LearningProgramTypeEnum;

  @Column({ type: DataType.STRING })
  @Field({ nullable: true })
  code: string;

  @Column
  @Field({ nullable: true })
  arTitle: string;

  @Column
  @Field({ nullable: true })
  enTitle: string;

  @Field({ nullable: true })
  @Column({ type: DataType.STRING })
  thumbnail: string;

  @Column(getColumnEnum(ContentLevelEnum))
  @Field(() => ContentLevelEnum, { nullable: true })
  level: ContentLevelEnum;

  @Column({ type: DataType.FLOAT })
  @Field({ nullable: true })
  learningTime: number;

  @Column
  @Field()
  remoteProductId: string;
}
