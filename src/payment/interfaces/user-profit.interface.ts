import { Field, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';

@ObjectType()
export class Revenue {
  @Field(() => MoneyScalar)
  lectureProfit: number;

  @Field(() => MoneyScalar)
  systemProfit: number;
}
