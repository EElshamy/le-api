import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IOrder } from '@src/payment/interfaces/product-line.interface';
import { Coupon } from '@src/payment/models/coupons.model';
import { User } from '@src/user/models/user.model';
import {
  AllowNull,
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
import { PurchaseItem } from './purchase-item.model';

@Table
@ObjectType()
export class Purchase extends Model implements IOrder {
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

  @Column
  @Field()
  totalQuantity: number;

  @Column
  @Field()
  totalPrice: number;

  @Column
  @Field()
  subTotalPrice: number;

  @HasMany(() => PurchaseItem)
  purchaseItems: PurchaseItem[];

  @ForeignKey(() => Coupon)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  couponId: string;
  
  @BelongsTo(() => Coupon, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @Field(() => Coupon, { nullable: true })
  coupon: Coupon;

  @CreatedAt
  @Field(() => Date)
  createdAt: Date;

  @UpdatedAt
  @Field(() => Date)
  @Column({ type: DataType.DATE })
  updatedAt: Date;
}
