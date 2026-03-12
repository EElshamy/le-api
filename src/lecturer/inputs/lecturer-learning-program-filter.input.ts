import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { UpperCaseLearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import {
  CourseStatusEnum,
  PublicationStatusEnum
} from '@src/course/enums/course.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

@InputType()
export class LecturerLearningProgramFilterInput {
  @Field(type => UpperCaseLearningProgramTypeEnum, { nullable: true })
  @IsEnum(UpperCaseLearningProgramTypeEnum)
  type: UpperCaseLearningProgramTypeEnum;

  @Field(type => CourseStatusEnum, { nullable: true })
  @IsEnum(CourseStatusEnum)
  status: CourseStatusEnum;

  @Field(type => PublicationStatusEnum, { nullable: true })
  @IsEnum(PublicationStatusEnum)
  visibility: PublicationStatusEnum;

  @Field(type => [Int], { nullable: true })
  categoryIds: number[];

  @Field(type => String, { nullable: true })
  @IsString()
  searchKey: string;
}
@ArgsType()
export class LecturerLearningProgramFilterArgs {
  @IsOptional()
  @Field(() => LecturerLearningProgramFilterInput, { nullable: true })
  filter?: LecturerLearningProgramFilterInput;
}
