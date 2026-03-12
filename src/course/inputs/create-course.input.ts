import {
  Field,
  Float,
  ID,
  InputType,
  Int,
  OmitType,
  PartialType
} from '@nestjs/graphql';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotEquals,
  ValidateIf
} from 'class-validator';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { LangEnum } from '../../user/user.enum';
import {
  CommissionType,
  ContentLevelEnum,
  CourseStatusEnum,
  CourseTimeUnit,
  CourseTypeEnum,
  LessonTypeEnum,
  PublicationStatusEnum,
  ResourceTypeEnum,
  SyllabusCreationMethodEnum
} from '../enums/course.enum';

import { IsNotBlank } from '@src/_common/custom-validator/not-bank.validator';
import { ValidFilePath } from '@src/_common/custom-validator/valid-file-path';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';
import { Transform } from 'class-transformer';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { ValidVideoId } from '@src/_common/custom-validator/video-id.validator';
import {
  CreateQuizInput,
  CreateQuizQuestionInput
} from '@src/quiz/input/create-quiz.input';
import { QuizDurationEnum } from '@src/quiz/enum/quiz.enum';

@InputType()
export class CourseLecturerInput {
  @IsUUID('4')
  @IsNotBlank()
  @Field(() => ID)
  userIdOfLecturer: string;

  @Max(100)
  @Min(0)
  @Field(() => Int)
  commission: number;

  @Field(() => CommissionType, { defaultValue: CommissionType.PERCENTAGE })
  commissionType: CommissionType;
}

@InputType()
export class CreateLessonResources {
  @Field()
  @TextValidation({ minLength: 2, maxLength: 500, disallowedChars: ['<', '>'] })
  url: string;

  @Field(() => ResourceTypeEnum)
  type: ResourceTypeEnum;
}

@InputType()
export class CreateLessonInput {
  @Field({ nullable: true })
  @IsOptional()
  @TextValidation({ minLength: 2, maxLength: 150, allowArabic: true })
  @MinLength(2)
  @MaxLength(150)
  enTitle: string;

  @Field({ nullable: true })
  @IsOptional()
  @TextValidation({ minLength: 2, maxLength: 150, allowArabic: true })
  @MinLength(2)
  @MaxLength(150)
  arTitle: string;

  @Field(() => LessonTypeEnum)
  type: LessonTypeEnum;

  @IsOptional()
  @IsInt({ message: 'learningTimeInMinutes must be an integer' })
  @Min(0, { message: 'learningTimeInMinutes must be greater than 0' })
  @Max(500, { message: 'learningTimeInMinutes must be less than 500' })
  @Field(() => Int, { nullable: true })
  learningTimeInMinutes: number;

  @Field()
  isPreview: boolean;

  @IsPositive()
  @Field(() => Int)
  order: number;

  // ---------- ARTICLE ----------
  @ValidateIf(o => o.type === LessonTypeEnum.ARTICLE)
  @Field({ nullable: true })
  @MaxLength(20000)
  @MinLength(2)
  content: string;

  @ValidateIf(o => o.type === LessonTypeEnum.ARTICLE)
  @IsOptional()
  @Field({ nullable: true })
  @MaxLength(10000)
  @MinLength(2)
  overview: string;

  // ---------- VIDEO ----------
  @ValidateIf(o => o.type === LessonTypeEnum.VIDEO)
  @Field({ nullable: true })
  @IsNotBlank()
  @ValidVideoId()
  videoId: string;

  // ---------- LIVE_SESSION ----------
  @ValidateIf(o => o.type === LessonTypeEnum.LIVE_SESSION)
  @Field({ nullable: true })
  @IsNotBlank()
  @IsUrl()
  videoUrl: string;

  @ValidateIf(o => o.type === LessonTypeEnum.LIVE_SESSION)
  @IsNotEmpty({ message: 'start date of live session is required' })
  @Field(() => Date, { nullable: true })
  liveSessionStartAt: Date;

  @ValidateIf(o => o.type === LessonTypeEnum.LIVE_SESSION)
  @IsNotEmpty({ message: 'end date of live session is required' })
  @Field(() => Date, { nullable: true })
  liveSessionEndAt: Date;

  // ---------- QUIZ ----------
  @ValidateIf(o => o.type === LessonTypeEnum.QUIZ)
  @Max(100, { message: 'Passing grade must be at most 100' })
  @Min(0, { message: 'Passing grade must be at least 0' })
  @Field(() => Number, { nullable: true, defaultValue: 0 })
  passingGrade: number;

  @ValidateIf(o => o.type === LessonTypeEnum.QUIZ)
  @IsOptional()
  @Min(1, { message: 'Duration must be at least 1' })
  @Max(9999, { message: 'Duration must be at most 9999' })
  @Field(() => Number, { nullable: true })
  duration?: number;

  @ValidateIf(o => o.type === LessonTypeEnum.QUIZ)
  @IsOptional()
  @IsEnum(QuizDurationEnum, { message: 'Invalid duration type' })
  @Field(() => QuizDurationEnum, { nullable: true })
  durationType?: QuizDurationEnum;

  @ValidateIf(o => o.type === LessonTypeEnum.QUIZ)
  @IsOptional()
  @IsInt({ message: 'Attempts allowed must be an integer' })
  @Min(1, { message: 'Attempts allowed must be at least 1' })
  @Max(9999, { message: 'Attempts allowed must be at most 9999' })
  @Field({ nullable: true })
  attemptsAllowed?: number;

  @ValidateIf(o => o.type === LessonTypeEnum.QUIZ)
  @Field({ defaultValue: false, nullable: true })
  showCorrectAnswers?: boolean;

  @ValidateIf(o => o.type === LessonTypeEnum.QUIZ)
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @Field(() => [CreateQuizQuestionInput], { nullable: true })
  @ValidateNested(CreateQuizQuestionInput, { each: true })
  questions: CreateQuizQuestionInput[];

  // ---------- RESOURCES ----------
  @IsOptional()
  @ValidateNested(CreateLessonResources, { each: true })
  @ArrayMinSize(1, { message: 'At least one resource is required' })
  @ArrayMaxSize(20, { message: 'Maximum of 20 resources allowed' })
  @Field(() => [CreateLessonResources], { nullable: 'itemsAndList' })
  resources: CreateLessonResources[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @ArrayMaxSize(100, { message: 'Maximum of 100 attachments allowed' })
  @IsString({ each: true })
  contentAttachments?: string[];

  sectionId: string;
}

@InputType()
export class CreateSectionInput {
  @Field()
  @TextValidation({
    minLength: 2,
    maxLength: 150,
    allowArabic: true
    // disallowedChars: ['<', '>', '-']
  })
  enTitle: string;

  @Field()
  @TextValidation({
    minLength: 2,
    maxLength: 150,
    allowArabic: true
    // disallowedChars: ['<', '>', '-']
  })
  arTitle: string;

  @Field(() => Int)
  @IsPositive()
  order: number;

  @ValidateNested(CreateLessonInput, { each: true })
  @ArrayMinSize(1, { message: 'At least one lesson is required' })
  @ArrayMaxSize(100, { message: 'Lessons limit is 100' })
  @Field(() => [CreateLessonInput])
  lessonsInput: CreateLessonInput[];
}

@InputType()
export class CreateCourseByLecturerInput {
  @IsPositive()
  @Field(() => Int)
  categoryId: number;

  // @IsPositive({ each: true })
  // @ArrayMaxSize(20)
  @Field(() => [Int], { nullable: true })
  skillsIds: number[];

  // @IsPositive({ each: true })
  // @ArrayMaxSize(20)
  @Field(() => [Int], { nullable: true })
  toolsIds: number[];

  @Field()
  @TextValidation({
    minLength: 2,
    maxLength: 70,
    allowArabic: true,
    disallowedChars: ['<', '>', '-']
  })
  arTitle: string;

  @IsOptional()
  @Field({ nullable: true })
  @TextValidation({
    minLength: 2,
    maxLength: 70,
    allowArabic: true,
    disallowedChars: ['<', '>', '-']
  })
  enTitle: string;

  @Field(() => LangEnum)
  language: LangEnum;

  @Field(() => PublicationStatusEnum)
  publicationStatus: PublicationStatusEnum;

  @Field(() => SyllabusCreationMethodEnum)
  syllabusCreationMethod: SyllabusCreationMethodEnum;

  @Field(() => ContentLevelEnum)
  level: ContentLevelEnum;

  @ValidateIf(
    o => o.syllabusCreationMethod === SyllabusCreationMethodEnum.MANUALLY
  )
  @ValidFilePath()
  @Field({ nullable: true })
  @MinLength(2)
  @Transform(({ value }) => value?.trim().replace(/\s+/g, '-'))
  @IsNotBlank()
  thumbnail: string;

  @Min(0)
  @Field(() => MoneyScalar)
  @Max(100000000, { message: 'originalPrice must be less than 1000000' })
  originalPrice: number;

  @IsOptional()
  @Min(0)
  @Max(100000000, {
    message: 'priceAfterDiscount must be less than 1000000'
  })
  @Field(() => MoneyScalar, { nullable: true })
  priceAfterDiscount: number;

  @IsPositive()
  @IsOptional()
  @Field({ nullable: true })
  learningTime: number;

  @ValidateIf(o => o.learningTime !== null && o.learningTime !== undefined)
  @IsNotEmpty()
  @Field(() => CourseTimeUnit, { nullable: true })
  learningTimeUnit: CourseTimeUnit;

  // @ValidateIf(
  //   o => o.syllabusCreationMethod === SyllabusCreationMethodEnum.MANUALLY
  // )
  @Field({ nullable: true })
  @ValidateIf(o => o.promoVideo != null && o.promoVideo.trim() !== '')
  @MinLength(2)
  @Transform(({ value }) => value?.trim())
  @IsNotBlank()
  @ValidVideoId()
  promoVideo?: string;

  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  @Transform(val => val.value?.trim())
  @IsNotBlank()
  // @Matches(/^[^\u0600-\u06FF]+$/, {
  //   message: 'enSummary must not contain Arabic characters.'
  // })
  @Field({ nullable: true })
  @TextValidation({ minLength: 2, maxLength: 500, allowArabic: true })
  enSummary: string;

  @Field()
  @TextValidation({ minLength: 2, maxLength: 500, allowArabic: true })
  arSummary: string;

  @Field()
  @TextValidation({
    minLength: 2,
    maxLength: 10000,
    allowArabic: true,
    disallowedChars: []
  })
  arAbout: string;

  @IsOptional()
  @MinLength(2)
  @MaxLength(10000)
  @Transform(val => val.value?.trim())
  @IsNotBlank()
  // @Matches(/^[^\u0600-\u06FF]+$/, {
  //   message: 'enAbout must not contain Arabic characters.'
  // })
  @Field({ nullable: true })
  @TextValidation({
    minLength: 2,
    maxLength: 10000,
    allowArabic: true,
    disallowedChars: []
  })
  enAbout: string;

  @IsOptional()
  @ArrayMaxSize(100, {
    message: 'Outcomes must be at most 100 items long'
  })
  @ValidFilePath({ each: true })
  @MinLength(2, { each: true })
  @IsNotBlank({ each: true })
  @Field(() => [String], { nullable: 'itemsAndList' })
  outcomes: string[];

  isCreatedByAdmin: boolean;

  status: CourseStatusEnum;

  @Field(() => CourseTypeEnum, { defaultValue: CourseTypeEnum.COURSE })
  type: CourseTypeEnum;

  @ValidateIf(
    o => o.syllabusCreationMethod === SyllabusCreationMethodEnum.MANUALLY
  )
  @ValidateNested(CreateSectionInput, { each: true })
  @ArrayMinSize(1, { message: 'At least one section is required' })
  @Field(() => [CreateSectionInput], { nullable: 'itemsAndList' })
  sectionsInput?: CreateSectionInput[];

  @Field({ nullable: true })
  collectionId?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  enforceLessonsOrder: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  ACE_Certificate: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  LDISAUDI_Certificate: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  NASM_Certificate: boolean;

  // ACE fields
  @ValidateIf(o => o.ACE_Certificate)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'ACE approved course Number must be alphanumeric'
  })
  @Length(2, 20, {
    message: 'ACE approved course Number must be between 2 and 20 characters'
  })
  @Field({ nullable: true })
  aceApprovedCourseNumber?: string;

  @ValidateIf(o => o.ACE_Certificate)
  @Matches(/^[A-Za-z\s\.\,\-\_]+$/, {
    message:
      'ACE present name must contain only English letters, spaces, and the characters . , - _'
  })
  @Length(1, 71, {
    message: 'ACE present name must be between 1 and 71 characters'
  })
  @Field({ nullable: true })
  acePresentName?: string;

  @ValidateIf(o => o.ACE_Certificate)
  @IsPositive({
    message:
      'ACE CECs awarded must be a positive number less than or equal to 9999'
  })
  @Max(9999, {
    message:
      'ACE CECs awarded must be a positive number less than or equal to 9999'
  })
  @Field(() => Float, { nullable: true })
  aceCecsAwarded?: number;

  @ValidateIf(o => o.ACE_Certificate)
  @Min(0, {
    message:
      'ACE days to get certified must be a positive number less than or equal to 364'
  })
  @Max(364, {
    message:
      'ACE days to get certified must be a positive number less than or equal to 364'
  })
  @IsInt({
    message:
      'ACE days to get certified must be a positive number less than or equal to 364'
  })
  @Field(() => Int, { nullable: true })
  aceDaysToGetCertified?: number;

  @ValidateIf(o => o.ACE_Certificate)
  @IsNotEmpty({ message: 'ACE slug is required' })
  @Length(1, 10, {
    message: 'ACE slug must be between 1 and 10 characters'
  })
  @NotEquals('LQC', { message: "ACE slug cannot be 'LQC'" })
  @Transform(({ value }) => value?.toUpperCase())
  @Field({ nullable: true })
  aceSlug?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  isLiveCourse?: boolean;
}

@InputType()
export class CreateCourseByAdminInput extends CreateCourseByLecturerInput {
  // @IsUUID('4')
  // @IsNotBlank()
  // @Field(type => ID, { nullable: true })
  // userIdOfLecturer: string;

  // @IsOptional()
  // @IsPositive()
  // @Field({ nullable: true })
  // commissionPercentage: number;

  @Field(() => [CourseLecturerInput])
  @IsOptional()
  @ValidateNested(CourseLecturerInput, { each: true })
  lecturersInput?: CourseLecturerInput[];
}

@InputType()
export class CreateDraftedCourseLessonInput extends PartialType(
  CreateLessonInput
) {}

@InputType()
export class CreateDraftedCourseSectionsInput extends OmitType(
  CreateSectionInput,
  ['lessonsInput']
) {
  @IsOptional()
  @ValidateNested(CreateDraftedCourseLessonInput)
  @ArrayMaxSize(100)
  @Field(() => [CreateDraftedCourseLessonInput], {
    nullable: 'itemsAndList'
  })
  lessonsInput?: Partial<CreateDraftedCourseLessonInput>[];
}

@InputType()
export class CreateDraftedCourseByAdminInput extends OmitType(
  PartialType(CreateCourseByAdminInput),
  ['sectionsInput']
) {
  @IsOptional()
  @ValidateNested(CreateDraftedCourseSectionsInput)
  @Field(() => [CreateDraftedCourseSectionsInput], { nullable: 'itemsAndList' })
  sectionsInput?: CreateDraftedCourseSectionsInput[];

  @Field(() => [ID], { nullable: 'itemsAndList' })
  sectionsToDelete?: string[];

  @Field(() => [ID], { nullable: 'itemsAndList' })
  lessonsToDelete?: string[];
}

@InputType()
export class CreateDraftedCourseByLecturerInput extends OmitType(
  PartialType(CreateCourseByLecturerInput),
  ['sectionsInput']
) {
  @IsOptional()
  @ValidateNested(CreateDraftedCourseSectionsInput)
  @Field(() => [CreateDraftedCourseSectionsInput], { nullable: 'itemsAndList' })
  sectionsInput?: CreateDraftedCourseSectionsInput[];
}
