import {
  ArgsType,
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  PartialType
} from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import {
  CouponApplicabilityScopeEnum,
  CouponDiscountTypeEnum,
  CouponSortEnum,
  CouponStatusEnum
} from '../enums/coupon.enums';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';

@InputType()
@ObjectType('CouponApplicability')
export class CouponApplicabilityInput {
  @IsOptional()
  @Field(() => [String], { nullable: true })
  applicableToIds?: string[];

  @IsNotEmpty()
  @IsEnum(CouponApplicabilityScopeEnum)
  @Field(() => CouponApplicabilityScopeEnum)
  applicabilityScope: CouponApplicabilityScopeEnum;
}

@InputType()
export class CouponRestrictionInput {
  @IsBoolean()
  @Field({ nullable: true })
  redeemableOnce: boolean;

  @Min(0)
  @Field(() => MoneyScalar, { nullable: true })
  minimumAmount: number;
}

@InputType('CouponDiscountInput')
@ObjectType()
export class CouponDiscount {
  @IsNotEmpty()
  @IsEnum(CouponDiscountTypeEnum)
  @Field(() => CouponDiscountTypeEnum)
  discountType: CouponDiscountTypeEnum;

  @Min(0)
  @Max(Infinity)
  @IsNumber()
  @IsNotEmpty()
  @Field(() => Float, { nullable: true })
  discountOff: number;
}

@InputType()
export class CreateCouponInput {
  @IsBoolean()
  @Field()
  isActive: boolean;

  @ValidateNested()
  @Field(() => CouponDiscount)
  discount: CouponDiscount;

  @IsNumber()
  @Field(() => Int, {
    description: 'Number of times this coupon can be redeemed',
    nullable: true
  })
  @IsOptional()
  redeemableCount: number; // usage limit

  @IsNotEmpty()
  @Field(() => Timestamp)
  endDate: Date;

  @IsNotEmpty()
  @Field(() => Timestamp)
  startDate: Date;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]+$/, {
    message:
      'Coupon code may only contain English letters, numbers, and special characters, without spaces.',
  })
  @Length(3, 20, {
    message: 'Coupon code must be between 3 and 20 characters long.',
  })
  @Field()
  code: string;
  

  @IsNotEmpty()
  @Field(() => CouponApplicabilityInput)
  applicabilityCriteria: CouponApplicabilityInput;

  @IsNotEmpty()
  @Field(() => CouponRestrictionInput)
  restrictions: CouponRestrictionInput;

  @Field()
  arTitle: string;

  @Field()
  enTitle: string;
}

@InputType()
export class UpdateCouponInput extends PartialType(CreateCouponInput) {
  @IsString()
  @IsNotEmpty()
  @Field()
  id: string;
}

@InputType()
export class DiscountOffFilterInput {
  @IsNumber()
  @Field(() => MoneyScalar, { nullable: true })
  from?: number;

  @IsNumber()
  @Field(() => MoneyScalar, { nullable: true })
  to?: number;
}

@InputType()
export class CouponActivationDateFilterInput {
  @IsNumber()
  @Field(() => Timestamp, { nullable: true })
  from?: string;

  @IsNumber()
  @Field(() => Timestamp, { nullable: true })
  to?: string;
}

@InputType()
export class ValidForFilterInput {
  @IsNumber()
  @Field(() => Int, { nullable: true })
  from?: number;

  @IsNumber()
  @Field(() => Int, { nullable: true })
  to?: number;
}

@InputType()
export class CouponFilterInput {
  @IsString()
  @Field({ nullable: true })
  searchKey?: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  discountType?: CouponDiscountTypeEnum;

  @Field(() => CouponStatusEnum, { nullable: true })
  status?: CouponStatusEnum;

  @Field(() => CouponApplicabilityScopeEnum, { nullable: true })
  applicabilityType?: CouponApplicabilityScopeEnum;

  @Field(() => DiscountOffFilterInput, { nullable: true })
  discountOff?: DiscountOffFilterInput;

  @Field(() => CouponActivationDateFilterInput, { nullable: true })
  activationDateFilter?: CouponActivationDateFilterInput;
}

@ArgsType()
export class CouponFilterArg {
  @Field(() => CouponFilterInput, { nullable: true })
  filter?: CouponFilterInput;
}

@InputType()
export class CouponSortInput {
  @Field(() => CouponSortEnum)
  sortBy?: CouponSortEnum;

  @Field(() => SortTypeEnum)
  sortType?: SortTypeEnum;
}

@ArgsType()
export class CouponSortArg {
  @Field(() => CouponSortInput)
  sort?: CouponSortInput;
}


@InputType()
export class CouponTransactionsInput {
  @Field(() => String)
  couponId: string;

  @Field(() => SortTypeEnum, { nullable: true })
  sortType?: SortTypeEnum;

  @Field(() => PaginatorInput, { nullable: true })
  pagination?: PaginatorInput;
}
