import { IsNotBlank } from '@src/_common/custom-validator/not-bank.validator';
import { ValidFilePath } from '@src/_common/custom-validator/valid-file-path';
import {
  ContentLevelEnum,
  CourseTimeUnit,
  PublicationStatusEnum,
  SyllabusCreationMethodEnum
} from '@src/course/enums/course.enum';
import { LangEnum } from '@src/user/user.enum';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  Max,
  Min,
  MinLength,
  ValidateIf
} from 'class-validator';

import { Field, Float, ID, InputType, Int, PartialType } from '@nestjs/graphql';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';
import { DiplomaStatusEnum } from '../enums/diploma-status.enum';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { ValidVideoId } from '@src/_common/custom-validator/video-id.validator';
import { DiplomaTypeEnum } from '../enums/diploma-type.enum';

@InputType()
export class CreateDiplomaInput {
  @IsPositive()
  @Field(() => Int)
  categoryId: number;

  @IsOptional()
  @IsPositive({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @Field(() => [Int], { nullable: true })
  skillsIds: number[];

  @IsOptional()
  @IsPositive({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @Field(() => [Int], { nullable: true })
  toolsIds: number[];

  @Field(() => [DiplomaLearningPrograms])
  learningPrograms: IDiplomaLearningPrograms[];

  @IsOptional()
  @TextValidation({ allowArabic: true, minLength: 2, maxLength: 70 })
  @Field({ nullable: true })
  arTitle: string;

  @IsOptional()
  @TextValidation({ allowArabic: false, minLength: 2, maxLength: 70 })
  @Field({ nullable: true })
  enTitle: string;

  @Field(() => LangEnum)
  @IsNotEmpty({ message: 'Please select the diploma language.' })
  language: LangEnum;

  @Field(() => PublicationStatusEnum, {
    description: 'in the other word the visibility status'
  })
  publicationStatus: PublicationStatusEnum;

  status: DiplomaStatusEnum;

  @Field(() => ContentLevelEnum)
  @IsNotEmpty({ message: 'Please select the diploma level.' })
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
  @Max(1000000000)
  @IsOptional()
  @Field(() => MoneyScalar, { nullable: true })
  originalPrice: number;

  @IsOptional()
  @Min(0)
  @Max(1000000000)
  @Field(() => MoneyScalar, { nullable: true })
  priceAfterDiscount: number;

  @Field({ nullable: true })
  @ValidateIf(o => o.learningTime != null)
  @Max(5000)
  learningTime?: number;

  @Field(() => CourseTimeUnit, { nullable: true })
  @ValidateIf(o => o.learningTimeUnit != null)
  learningTimeUnit?: CourseTimeUnit;

  @Field({ nullable: true })
  @ValidateIf(o => o.promoVideo != null && o.promoVideo.trim() !== '')
  @MinLength(2)
  @Transform(({ value }) => value?.trim())
  @IsNotBlank()
  @ValidFilePath()
  @ValidVideoId()
  promoVideo?: string;

  @IsOptional()
  @TextValidation({ allowArabic: false, minLength: 2, maxLength: 500 })
  @IsNotBlank()
  // @Matches(/^[a-zA-Z\s]+$/, {
  //   message: 'enSummary must be in English characters only.'
  // })
  @Field({ nullable: true })
  enSummary: string;

  @TextValidation({ allowArabic: true, minLength: 2, maxLength: 500 })
  @IsNotBlank()
  @Field()
  arSummary: string;

  @TextValidation({
    allowArabic: true,
    minLength: 2,
    maxLength: 10000,
    disallowedChars: []
  })
  @IsNotBlank()
  @Field()
  arAbout: string;

  @TextValidation({
    allowArabic: false,
    minLength: 2,
    maxLength: 10000,
    disallowedChars: []
  })
  @IsNotBlank()
  // @Matches(/^[a-zA-Z\s]+$/, {
  //   message: 'enAbout must be in English characters only.'
  // })
  @Field()
  enAbout: string;

  @IsOptional()
  @ArrayMaxSize(100)
  @ValidFilePath({ each: true })
  @MinLength(2, { each: true })
  @IsNotBlank({ each: true })
  @Field(() => [String], { nullable: 'itemsAndList' })
  outcomes: string[];

  @Field({ nullable: true })
  collectionId?: string;

  @IsOptional()
  @IsPositive({ message: 'Access duration per months must be greater than 0' })
  @Min(1, { message: 'Access duration per months must be greater than 0' })
  @Max(60, { message: 'Access duration per months must be less than 60' })
  @Field(() => Int, { nullable: true })
  accessDurationPerMonths?: number;

  @IsOptional()
  @Field(() => DiplomaTypeEnum, {
    defaultValue: DiplomaTypeEnum.PATH
  })
  diplomaType?: DiplomaTypeEnum;
}

@InputType()
export class DiplomaLearningPrograms {
  @Field(() => ID)
  courseId: number;
  @Field(() => MoneyScalar, { nullable: true })
  PriceUnderDiploma: number;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0, { message: 'Commission under diploma must be greater than 0' })
  @Max(100, { message: 'Commission under diploma must be less than 100' })
  commissionUnderDiploma: number;
}

export interface IDiplomaLearningPrograms {
  courseId?: string;
  PriceUnderDiploma?: number;
  commissionUnderDiploma?: number;
  websiteUrl?: string;
}

@InputType()
export class CreateDraftedDiplomaInput extends PartialType(
  CreateDiplomaInput
) {}

@InputType()
export class PublishDraftedDiplomaInput extends CreateDiplomaInput {
  @Field(() => ID)
  diplomaId: string;
}
