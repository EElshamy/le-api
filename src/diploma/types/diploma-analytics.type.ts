import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DiplomaAnalyticsCourse {
  @Field(() => String)
  id: string;

  @Field()
  enTitle: string;

  @Field()
  arTitle: string;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field()
  code: string;
}

@ObjectType()
export class DiplomaAnalytics {
  @Field(() => DiplomaAnalyticsCourse)
  courseData: DiplomaAnalyticsCourse;

  @Field()
  viewsCount: number;

  @Field()
  viewsPercentage: number;
}
