import { Field, Int, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { Transaction } from '@src/payment/models/transaction.model';

@ObjectType()
export class LearningProgramRevenueAnalytics {
  @Field(() => [MonthlyOrYearlyLearningProgramShareChart])
  chart: MonthlyOrYearlyLearningProgramShareChart[];

  @Field(() => MoneyScalar)
  totalPlatform: number;

  @Field(() => MoneyScalar)
  totalInstructors: number;

  @Field(() => MoneyScalar)
  total: number;

  @Field(() => [Transaction])
  transactions: Transaction[];

  @Field(() => MoneyScalar)
  maxYAxisNumber: number;
}

@ObjectType()
export class MonthlyOrYearlyLearningProgramShareChart {
  @Field()
  enName: string;

  @Field()
  arName: string;

  @Field(() => MoneyScalar)
  platform: number;

  @Field(() => MoneyScalar)
  instructor: number;

  @Field(() => MoneyScalar)
  total: number;
}
