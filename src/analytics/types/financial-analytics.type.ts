import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';

@ObjectType()
export class FinancialChartItem {
  @Field()
  enName: string;

  @Field()
  arName: string;

  @Field(() => MoneyScalar)
  platform: number;

  @Field(() => MoneyScalar)
  instructor: number;

  @Field(() => MoneyScalar)
  vat: number;

  @Field(() => MoneyScalar)
  paymentGatewayVat: number;

  @Field(() => MoneyScalar)
  total: number;
}

@ObjectType()
export class FinancialAnalytics {
  @Field(() => [FinancialChartItem])
  chart: FinancialChartItem[];

  @Field(() => MoneyScalar)
  totalGMV: number;

  @Field(() => MoneyScalar)
  totalPlatform: number;

  @Field(() => MoneyScalar)
  totalInstructors: number;

  @Field(() => MoneyScalar)
  totalRefunds: number;

  @Field(() => MoneyScalar)
  totalVat: number;

  @Field(() => MoneyScalar)
  totalPaymentGatewayVat: number;

  @Field(() => MoneyScalar)
  maxYAxisNumber: number;
}


export interface MonthlyAnalyticsResult {
  month: number;
  platform: number;
  instructor: number;
  paymentGatewayVat: number;
  vat: number;
  total: number;
}

export interface YearlyAnalyticsResult {
  year: number;
  platform: number;
  instructor: number;
  paymentGatewayVat: number;
  vat: number;
  total: number;
}
