import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { Purchase } from '@src/cart/models/purchase.model';
import {
  AllowNull,
  BeforeCreate,
  BeforeUpdate,
  Column,
  CreatedAt,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt
} from 'sequelize-typescript';
import { paginate } from '../../_common/paginator/paginator.service';
import { CouponDiscountTypeEnum } from '../enums/coupon.enums';
import { ApplicableForMetadata, ICoupon } from '../interfaces/coupon.interface';
import { CouponApplicabilityInput } from '../inputs/coupons.inputs';

@Table
@ObjectType()
export class Coupon extends Model implements ICoupon {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Unique
  @Field(() => String)
  @Column(DataType.STRING)
  code: string;

  @Unique
  @Field(() => String, { nullable: true })
  @Column(DataType.STRING)
  slug: string;

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

  @Column(DataType.STRING)
  @Field(() => String, { nullable: true })
  remoteCouponId: string;

  @Field(() => Int)
  @Column(DataType.INTEGER)
  discountOff: number;

  @Default(CouponDiscountTypeEnum.PERCENTAGE)
  @Column({ type: getColumnEnum(CouponDiscountTypeEnum) })
  @Field(() => CouponDiscountTypeEnum)
  discountType: CouponDiscountTypeEnum;

  @Field(() => Int, {
    nullable: true
  })
  @Column(DataType.INTEGER)
  redeemableCount: number;

  @Default(0)
  @Field(() => Int)
  @Column(DataType.INTEGER)
  timesUsed: number;

  @AllowNull(true)
  @Column(DataType.ARRAY(DataType.STRING))
  remoteApplicableFor: string[];

  @AllowNull(true)
  @Column(DataType.ARRAY(DataType.STRING))
  specificIds: string[];

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  @Field(() => [ApplicableForMetadata], { nullable: true })
  applicableForMetadata: ApplicableForMetadata[];

  @Column({ type: DataType.JSON })
  @Field(() => CouponApplicabilityInput)
  applicabilityCriteria: CouponApplicabilityInput;

  @Column({ type: DataType.STRING })
  @Field()
  applicability: string;

  @Field(() => Timestamp)
  @Column({ type: DataType.DATE })
  endDate: Date;

  @Field(() => Timestamp)
  @Column({ type: DataType.DATE })
  startDate: Date;

  @Field({ nullable: true })
  @Column({ type: DataType.BOOLEAN })
  redeemableOnce: boolean;


  @Field(() => MoneyScalar , { nullable: true })
  @Column({ type: DataType.INTEGER , defaultValue: 0 })
  minimumAmount: number;

  @Field()
  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  isActive: boolean;

  @Field(() => [Purchase])
  @HasMany(() => Purchase)
  purchases: Purchase[];

  @CreatedAt
  @Field(() => Timestamp)
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt: Date;

  @BeforeCreate
  @BeforeUpdate
  static uppercaseCode(instance: Coupon) {
    if (instance.code) {
      instance.code = instance.code.toUpperCase();
    }
  }

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include = []
  ): Promise<PaginationRes<Coupon>> {
    return paginate<Coupon>(this, filter, sort, page, limit, include);
  }
}
