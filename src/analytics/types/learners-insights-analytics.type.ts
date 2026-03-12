import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LearnersInsightsAnalytics {
  @Field(() => Float)
  certificateCompletionRate: number;

  @Field(() => Float)
  programsSatisfactionScore: number;

  @Field(() => Float)
  repeatEnrollmentRate: number;
}
