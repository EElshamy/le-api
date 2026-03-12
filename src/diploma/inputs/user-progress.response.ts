import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserProgressResponse {
  @Field(() => Number)
  completedLessons: number;

  @Field(() => Number)
  totalLessons: number;
}
