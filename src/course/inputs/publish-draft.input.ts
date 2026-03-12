import { Field, ID, InputType, Int, OmitType } from '@nestjs/graphql';
import { CreateCourseByAdminInput, CreateCourseByLecturerInput } from './create-course.input';
import { IsOptional, IsUUID } from 'class-validator';
import { Is } from 'sequelize-typescript';

@InputType()
export class PublishDraftedCourseAdminInput extends OmitType(CreateCourseByAdminInput, [
  'type',
  'syllabusCreationMethod'
]) {
  @IsUUID()
  @Field(() => ID)
  courseId: string;
  @IsOptional()
  @Field(() => [ID], { nullable: true })
  sectionsToDelete?: string[];
  @IsOptional()
  @Field(() => [Int], { nullable: true })
  lessonsToDelete?: number[];
}

@InputType()
export class PublishDraftedCourseLecturerInput extends OmitType(CreateCourseByLecturerInput, [
  'type',
  'syllabusCreationMethod'
]) {
  @IsUUID()
  @Field(() => ID)
  courseId: string;

  @IsOptional()
  @Field(() => [ID], { nullable: true })
  sectionsToDelete?: string[];

  @IsOptional()
  @Field(() => [Int], { nullable: true })
  lessonsToDelete?: number[];
}
