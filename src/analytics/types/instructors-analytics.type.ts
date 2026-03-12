import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';

@ObjectType()
export class IntructorsChartItem {
  @Field()
  enName: string;

  @Field()
  arName: string;

  @Field(() => Int)
  applicantsCount: number;
}

@ObjectType()
export class IntructorsAnalytics {
  @Field(() => [IntructorsChartItem])
  chart: IntructorsChartItem[];

  @Field(() => Int)
  totalInstructors: number;

  @Field(() => Int)
  newApplicantsCount: number;

  @Field(() => Float)
  approvalRate: number;

  @Field(() => Int)
  maxYAxisNumber: number;
}
