import { Field, InputType } from '@nestjs/graphql';
import { LearningProgramTypeEnum } from '../enums/cart.enums';

@InputType()
export class BuyNowInput {
  @Field()
  programId: string;
  @Field(() => LearningProgramTypeEnum)
  programType: LearningProgramTypeEnum;
  @Field({ nullable: true })
  coupon_code?: string;
}

@InputType()
export class ApplyCouponInput {
  @Field()
  programId: string;

  @Field(() => LearningProgramTypeEnum)
  programType: LearningProgramTypeEnum;

  @Field()
  couponCode: string;
}
