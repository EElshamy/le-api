import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PlatformGrowthChartItem {
  @Field()
  enName: string;

  @Field()
  arName: string;

  @Field(() => Int)
  newUsersCount: number;
}

@ObjectType()
export class PlatformGrowthAnalytics {
  @Field(() => [PlatformGrowthChartItem])
  chart: PlatformGrowthChartItem[];

  @Field(() => Int)
  totalNewUsers: number;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalActiveUsersInTheLastMonth: number;

  @Field(() => Int)
  totalInactiveUsersInTheLastMonth: number;

  @Field(() => Float)
  activeUsersPercentage: number;

  @Field(() => Float)
  inactiveUsersPercentage: number;

  @Field(() => Int)
  maxYAxisNumber: number;
}
