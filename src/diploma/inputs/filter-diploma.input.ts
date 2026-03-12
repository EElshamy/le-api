import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { IsNotBlank } from '@src/_common/custom-validator/not-bank.validator';
import {
  ContentLevelEnum,
  CourseTypeEnum,
  PublicationStatusEnum
} from '@src/course/enums/course.enum';
import { CourseUserFilterEnum } from '@src/course/inputs/course-user-filter.input';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { DiplomaStatusEnum } from '../enums/diploma-status.enum';
import {
  DiplomaSortInput,
  ProgramsSortInput,
  UsersSortInput
} from './sort-diploma.input';
import { DiplomaTypeEnum } from '../enums/diploma-type.enum';

@InputType()
export class FilterDiplomaInput {
  @Field(() => Number, { nullable: true })
  categoryId?: number;

  @Field(() => ContentLevelEnum, { nullable: true })
  level?: ContentLevelEnum;

  @Field(() => Number, { nullable: true })
  averageRating?: number;

  @Field(() => Number, { nullable: true })
  enrolledUsersCount?: number;

  @Field(() => String, { nullable: true })
  collectionId?: string;

  @Field(() => String, { nullable: true })
  lecturerId?: string;

  @Field(() => DiplomaStatusEnum, { nullable: true })
  status?: DiplomaStatusEnum;

  @Field(() => PublicationStatusEnum, { nullable: true })
  publicationStatus?: PublicationStatusEnum;

  @Field(() => DiplomaTypeEnum, { nullable: true })
  diplomaType?: DiplomaTypeEnum;

  @IsOptional()
  @IsNotBlank()
  @MaxLength(500)
  @MinLength(1)
  @Field(() => String, { nullable: true })
  searchKey?: string;
}

@InputType()
export class FilterDiplomaUsersInput {
  @IsOptional()
  @Field(() => CourseUserFilterEnum, { nullable: true })
  Progress?: CourseUserFilterEnum;

  @IsOptional()
  @Field(() => Boolean, { nullable: true, defaultValue: false })
  isBlocked: boolean;

  @IsOptional()
  @Field(() => Boolean, { nullable: true, defaultValue: false })
  isDeleted: boolean;
}

@InputType()
export class DiplomaProgramsFilterInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  userIdOfLecturer?: string;

  @IsOptional()
  @Field(() => CourseTypeEnum, { nullable: true })
  programType?: CourseTypeEnum;
}

@InputType()
export class DiplomasSiteFilterInput {
  @Field(() => [Int], { nullable: true })
  categoryIds: number[];

  @Field({ nullable: true })
  lecturerId: string;

  @Field({ nullable: true })
  price: number;

  @Field(() => [ContentLevelEnum], { nullable: true })
  level: ContentLevelEnum[];

  @Field({ nullable: true })
  learningTime: number;

  @Field({ nullable: true })
  @IsString()
  searchKey: string;

  @Field(() => [String], { nullable: true })
  excludedIds?: string[];

  @Field(() => DiplomaTypeEnum, { nullable: true })
  diplomaType?: DiplomaTypeEnum;
}

@ArgsType()
export class GeneralFilterDiplomaInput {
  @IsOptional()
  @Field({ nullable: true })
  filter: FilterDiplomaInput;
}

@ArgsType()
export class DiplomaUsersBoardFilterInput {
  @IsOptional()
  @Field({ nullable: true })
  filter: FilterDiplomaUsersInput;
}

@ArgsType()
export class DiplomaProgramsBoardFilterInput {
  @IsOptional()
  @Field({ nullable: true })
  filter: DiplomaProgramsFilterInput;
}

@ArgsType()
export class diplomasSiteFilterArgs {
  @IsOptional()
  @Field({ nullable: true })
  filter: DiplomasSiteFilterInput;
}

@ArgsType()
export class DiplomasBoardSortInput {
  @IsOptional()
  @Field({ nullable: true })
  sort: DiplomaSortInput;
}

@ArgsType()
export class DiplomaProgramsSortInput {
  @IsOptional()
  @Field({ nullable: true })
  sort: ProgramsSortInput;
}

@ArgsType()
export class DiplomaUsersBoardSortInput {
  @IsOptional()
  @Field({ nullable: true })
  sort: UsersSortInput;
}
