import { Field, Int, Float, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { LearningProgramTypeForAnalyticsEnum } from '@src/cart/enums/cart.enums';

@ObjectType()
export class EnrollmentChartItem {
  @Field()
  enName: string;

  @Field()
  arName: string;

  @Field(() => Int)
  coursesCount: number;

  @Field(() => Float)
  coursesPercentage: number;

  @Field(() => Int)
  workshopsCount: number;

  @Field(() => Float)
  workshopsPercentage: number;

  @Field(() => Int)
  liveWorkshopsCount: number;

  @Field(() => Float)
  liveWorkshopsPercentage: number;

  @Field(() => Int)
  pathsCount: number;

  @Field(() => Float)
  pathsPercentage: number;

  @Field(() => Int)
  subscriptionsCount: number;

  @Field(() => Float)
  subscriptionsPercentage: number;

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class EnrollmentChart {
  @Field(() => [EnrollmentChartItem])
  chart: EnrollmentChartItem[];

  @Field(() => Float)
  coursesPercentage: number;

  @Field(() => Float)
  workshopsPercentage: number;

  @Field(() => Float)
  liveWorkshopsPercentage: number;

  @Field(() => Float)
  pathsPercentage: number;

  @Field(() => Float)
  subscriptionsPercentage: number;

  @Field(() => Int)
  maxYAxisNumber: number;
}

@ObjectType()
export class TopPerformingProgramsChartItem {
  @Field()
  enName: string;

  @Field()
  arName: string;

  @Field(() => LearningProgramTypeForAnalyticsEnum)
  learningProgramType: LearningProgramTypeForAnalyticsEnum;

  @Field(() => Int)
  enrollmentsCount: number;
}

@ObjectType()
export class TopPerformingProgramsChart {
  @Field(() => [TopPerformingProgramsChartItem])
  chart: TopPerformingProgramsChartItem[];

  @Field(() => Int)
  maxYAxisNumber: number;
}

@ObjectType()
export class TopPerformingCategoriesChartItem {
  @Field()
  enName: string;

  @Field()
  arName: string;

  @Field(() => Int)
  enrollmentsCount: number;
}

@ObjectType()
export class TopPerformingCategoriesChart {
  @Field(() => [TopPerformingCategoriesChartItem])
  chart: TopPerformingCategoriesChartItem[];

  @Field(() => Int)
  maxYAxisNumber: number;
}

@ObjectType()
export class LearningProgramsAnalytics {
  @Field(() => Int)
  totalProgramsPublished: number;

  @Field(() => Int)
  totalEnrollments: number;

  @Field(() => Float)
  enrollmentsRate: number;

  @Field(() => MoneyScalar)
  averageProgramPrice: number;

  @Field(() => EnrollmentChart)
  enrollments: EnrollmentChart;

  @Field(() => TopPerformingProgramsChart)
  topPerformingPrograms: TopPerformingProgramsChart;

  @Field(() => TopPerformingCategoriesChart)
  topPerformingCategories: TopPerformingCategoriesChart;
}
