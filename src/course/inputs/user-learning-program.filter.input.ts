import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { CourseTypeEnum } from '../enums/course.enum';
import { CourseUserFilterInput } from './course-user-filter.input';

export enum ReviewStatusEnum {
  REVIEWED = 'REVIEWED',
  NOT_REVIEWED = 'NOT_REVIEWED'
}

registerEnumType(ReviewStatusEnum, { name: 'ReviewStatusEnum' });

@InputType()
export class userLearningProgramFilterInput extends CourseUserFilterInput {
  @Field(type => CourseTypeEnum, { nullable: true })
  @IsEnum(CourseTypeEnum)
  type: CourseTypeEnum;

  @Field(type => ReviewStatusEnum, { nullable: true })
  @IsEnum(ReviewStatusEnum)
  reviewStatus: ReviewStatusEnum;

  @Field({ nullable: true })
  searchKey?: string;
}
@ArgsType()
export class userLearningProgramFilterArgs {
  @IsOptional()
  @Field(() => userLearningProgramFilterInput, { nullable: true })
  filter?: userLearningProgramFilterInput;
}
