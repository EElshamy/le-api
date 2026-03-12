import { Field, Int, Float, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { LearningProgramTypeForAnalyticsEnum } from '@src/cart/enums/cart.enums';

@ObjectType()
export class MostCommonIssuesChartItem {
  @Field()
  enName: string;

  @Field()
  arName: string;

  @Field(() => Int)
  reportsCount: number;
}

@ObjectType()
export class MostCommonIssuesChart {
  @Field(() => [MostCommonIssuesChartItem])
  chart: MostCommonIssuesChartItem[];

  @Field(() => Int)
  maxYAxisNumber: number;
}

@ObjectType()
export class MostReportedProgramsChartItem {
  @Field()
  enName: string;

  @Field()
  arName: string;

  @Field(() => LearningProgramTypeForAnalyticsEnum)
  learningProgramType: LearningProgramTypeForAnalyticsEnum;

  @Field(() => Int)
  reportsCount: number;
}

@ObjectType()
export class MostReportedProgramsChart {
  @Field(() => [MostReportedProgramsChartItem])
  chart: MostReportedProgramsChartItem[];

  @Field(() => Int)
  maxYAxisNumber: number;
}

@ObjectType()
export class SupportAndFeedbackAnalytics {
  @Field(() => Int)
  resolvedReports: number;

  @Field(() => Float)
  resolvedReportsPercentage: number;

  @Field(() => Int)
  openedReports: number;

  @Field(() => Float)
  openedReportsPercentage: number;

  @Field(() => Int)
  invalidReports: number;

  @Field(() => Float)
  invalidReportsPercentage: number;

  @Field(() => Int)
  totalReports: number;

  @Field(() => Int)
  reportedPrograms: number;

  @Field(() => Int)
  reportedInstructors: number;

  @Field(() => Int)
  reportedComments: number;

  @Field(() => Int)
  reportedBlogs: number;

  @Field(() => Int)
  reportedReviews: number;

  @Field(() => MostCommonIssuesChart)
  mostCommonIssues: MostCommonIssuesChart;

  @Field(() => MostReportedProgramsChart)
  mostReportedPrograms: MostReportedProgramsChart;
}
