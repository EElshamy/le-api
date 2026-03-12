import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { User } from '@src/user/models/user.model';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { CartItem } from './cart-item.model';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';

@Table
@ObjectType()
export class Cart extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @ForeignKey(() => User)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  userId: string;

  @BelongsTo(() => User)
  @Field(() => User)
  user: User;

  //todo this should be calculated from cartItems
  @Default(0)
  @Column({ type: DataType.INTEGER })
  @Field(() => MoneyScalar, {
    description: 'cart total price with no discount'
  })
  totalPrice: number;

  @Field(() => Float, { description: 'cart total price after discount' })
  totalPriceAfterDiscount: number;

  @Field(() => Float, { description: 'subTotal price ' })
  netPrice: number;

  @Field({ nullable: true })
  vat: number;

  @Field(() => Float, { nullable: true })
  vatAmount: number;

  @Field(() => Float, { nullable: true })
  discountAmount: number;

  @Default(0)
  @Column
  @Field(() => Int)
  totalQuantity: number;

  @ForeignKey(() => CartItem)
  cartItemId: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  @Field(() => Boolean, { nullable: true })
  checkoutAvailable: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: DataType.STRING })
  lastAppliedCoupon: string;

  @Field(() => [CartItem])
  @HasMany(() => CartItem)
  cartItems: CartItem[];

  @CreatedAt
  @Field(() => Date)
  createdAt: Date;

  @UpdatedAt
  @Field(() => Date)
  @Column({ type: DataType.DATE })
  updatedAt: Date;

  @BeforeCreate
  @BeforeUpdate
  static setTotalPrice(cart: Cart) {
    if (cart.lastAppliedCoupon) {
      cart.lastAppliedCoupon = cart.lastAppliedCoupon.toUpperCase();
    }
  }
}

@ObjectType()
export class CartAlert {
  @Field({ nullable: true })
  diplomaId: string;
  @Field({ nullable: true })
  programId: string;
  @Field({ nullable: true })
  programType: string;
  @Field({ nullable: true })
  diplomaTitle: string;
  @Field({ nullable: true })
  programTitle: string;
}
