import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@ArgsType()
export class CourseInput {
  @IsUUID()
  @Field(() => ID)
  courseId: string;
}
