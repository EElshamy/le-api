import {
  Field,
  ID,
  InputType,
  Int,
  IntersectionType,
  OmitType,
  PartialType
} from '@nestjs/graphql';
import { IsOptional, IsPositive, IsUUID, ValidateIf } from 'class-validator';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import {
  CreateCourseByAdminInput,
  CreateCourseByLecturerInput,
  CreateLessonInput,
  CreateSectionInput
} from './create-course.input';
import { LessonTypeEnum } from '../enums/course.enum';
import { UpdateQuizQuestionInput } from '@src/quiz/input/update-quiz.input';

@InputType()
export class UpdateSectionLessonsInput extends PartialType(
  OmitType(CreateLessonInput, ['questions'])
) {
  @IsOptional()
  @IsPositive()
  @Field(() => Int, { nullable: true })
  lessonId: number;

  @IsOptional()
  @IsUUID()
  @Field(() => ID, { nullable: true })
  sectionId: string;

  // Update questions
  @ValidateIf(o => o.type === LessonTypeEnum.QUIZ)
  @Field(() => [UpdateQuizQuestionInput], { nullable: true })
  @ValidateNested(UpdateQuizQuestionInput, { each: true })
  questions?: UpdateQuizQuestionInput[];
}

@InputType()
export class UpdateCourseSectionsInput extends OmitType(
  PartialType(CreateSectionInput),
  ['lessonsInput']
) {
  @ValidateNested(UpdateSectionLessonsInput, { each: true })
  @IsOptional()
  @Field(() => [UpdateSectionLessonsInput], { nullable: 'itemsAndList' })
  lessons: UpdateSectionLessonsInput[];

  @IsOptional()
  @IsUUID()
  @Field(() => ID, { nullable: true })
  sectionId: string;
}

@InputType()
export class UpdateCourseInput {
  @IsUUID()
  @Field(() => ID)
  courseId: string;

  @Field(() => [Int], { nullable: true })
  lessonsToDelete?: number[];

  @Field(() => [ID], { nullable: 'itemsAndList' })
  sectionsToDelete?: string[];

  @IsOptional()
  @ValidateNested(UpdateCourseSectionsInput, { each: true })
  @Field(() => [UpdateCourseSectionsInput], { nullable: 'itemsAndList' })
  sections?: UpdateCourseSectionsInput[];

  @IsOptional()
  @Field({ nullable: true })
  changeReason?: string;
}

@InputType()
export class UpdateCourseByLecturerInput extends IntersectionType(
  UpdateCourseInput,
  OmitType(PartialType(CreateCourseByLecturerInput), [
    'sectionsInput',
    'type',
    'syllabusCreationMethod'
  ])
) {}

@InputType()
export class UpdateCourseByAdminInput extends IntersectionType(
  UpdateCourseInput,
  OmitType(PartialType(CreateCourseByAdminInput), [
    'sectionsInput',
    'type',
    'syllabusCreationMethod'
  ])
) {}
