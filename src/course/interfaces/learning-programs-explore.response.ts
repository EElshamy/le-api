import { Diploma } from '@src/diploma/models/diploma.model';
import { Course } from '../models/course.model';
import { Field, ObjectType } from '@nestjs/graphql';
import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';

@ObjectType()
export class LearningProgramsExplore {
  @Field(() => [Course], { nullable: true })
  popularCourses: Course[];
  @Field(() => [Course], { nullable: true })
  liveCourses: Course[];
  @Field(() => [Course], { nullable: true })
  latestWorkshops: Course[];
  @Field(() => [Diploma], { nullable: true })
  pathDiplomas: Diploma[];
  @Field(() => [Diploma], { nullable: true })
  subscriptionDiplomas: Diploma[];
}
export const GqlLearningProgramsExploreResponse = generateGqlResponseType(
  LearningProgramsExplore
);

@ObjectType()
export class LearningProgramsForCategory {
  @Field(() => [Course], { nullable: true })
  Courses: Course[];
  @Field(() => [Course], { nullable: true })
  liveCourses: Course[];
  @Field(() => [Course], { nullable: true })
  Workshops: Course[];
  @Field(() => [Diploma], { nullable: true })
  pathDiplomas: Diploma[];
  @Field(() => [Diploma], { nullable: true })
  subscriptionDiplomas: Diploma[];
}
export const GqlLearningProgramsForCategoryResponse = generateGqlResponseType(
  LearningProgramsForCategory
);
