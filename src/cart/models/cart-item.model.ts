import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
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
import { LearningProgramTypeEnum } from '../enums/cart.enums';
import { Cart } from './cart.model';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import {
  CartItemAlertObjectType,
  CartItemAlertType
} from '../interfaces/cart-item-alert.type';

@Table
@ObjectType()
export class CartItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Column
  @Field()
  learningProgramId: string;

  @Field(() => LearningProgramTypeEnum)
  @Column(getColumnEnum(LearningProgramTypeEnum))
  learningProgramType: LearningProgramTypeEnum;

  @ForeignKey(() => Cart)
  cartId: string;

  @BelongsTo(() => Cart)
  @Field(() => Cart)
  cart: Cart;

  @Column({ type: DataType.JSONB, defaultValue: { text: null, hex: null } })
  @Field(() => CartItemAlertObjectType, { nullable: true })
  arAlert?: CartItemAlertType;

  @Column({ type: DataType.JSONB, defaultValue: { text: null, hex: null } })
  @Field(() => CartItemAlertObjectType, { nullable: true })
  enAlert?: CartItemAlertType;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field(() => String, { nullable: true })
  arPriceMessage: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field(() => String, { nullable: true })
  enPriceMessage: string;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  @Field(() => MoneyScalar, { nullable: true })
  adjustedPrice?: number;

  @CreatedAt
  @Field(() => Date)
  createdAt: Date;

  @UpdatedAt
  @Field(() => Date)
  @Column({ type: DataType.DATE })
  updatedAt: Date;
}
