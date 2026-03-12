import { Field, InputType } from '@nestjs/graphql';
import { CourseTypeEnum } from '../enums/course.enum';

@InputType()
export class MostPopuliarInput {
  @Field(type => CourseTypeEnum)
  type: CourseTypeEnum;
}
