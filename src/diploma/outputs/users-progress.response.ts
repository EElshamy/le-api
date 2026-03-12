import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '@src/user/models/user.model';

@ObjectType()
export class UserProgress extends User {
  @Field(() => Number)
  totalLessonsInDiploma: number;

  @Field(() => Number)
  completedLessonsInDiploma: number;
}

@ObjectType()
export class userProgressByPrograms {
  @Field(() => Number)
  totalProgramsCount: number;
  @Field(() => Number)
  completedProgramsCount: number;
}
