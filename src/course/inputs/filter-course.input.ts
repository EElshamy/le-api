import { ArgsType, Field, ID, InputType, Int, PickType } from '@nestjs/graphql';
import {
  IsEnum,
  IsOptional,
  IsPositive,
  IsUUID,
  MaxLength,
  MinLength
} from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import {
  ContentLevelEnum,
  CourseApprovalStatusFilterEnum,
  CourseSortEnum,
  CoursesSiteSortEnum,
  CourseStatusEnum,
  CourseStatusFilter,
  CourseTypeEnum,
  PublicationStatusEnum,
  SyllabusCreationMethodEnum
} from '../enums/course.enum';

@InputType()
export class CourseFilterByLecturerInput {
  @Field(() => PublicationStatusEnum, { nullable: true })
  publicationStatus?: PublicationStatusEnum;

  @Field(() => CourseTypeEnum, { nullable: true })
  type?: CourseTypeEnum;

  @Field(() => CourseStatusFilter, { nullable: true })
  courseStatus?: CourseStatusFilter;

  @Field(() => SyllabusCreationMethodEnum, { nullable: true })
  syllabusCreationMethod?: SyllabusCreationMethodEnum;

  @Field(() => CourseApprovalStatusFilterEnum, { nullable: true })
  status?: CourseStatusEnum.PENDING | CourseStatusEnum.REJECTED;

  @Field(() => Int, { nullable: true })
  categoryId?: number;

  @Field(() => Boolean, { nullable: true})
  isLiveCourse?: boolean;

  @IsOptional()
  @IsNotBlank()
  @MaxLength(500)
  @MinLength(1)
  @Field({ nullable: true })
  searchKey?: string;
}

@InputType()
export class CourseFilterBySiteInput {
  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsPositive({ each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsNotBlank()
  @MaxLength(500)
  @MinLength(1)
  @Field({ nullable: true })
  searchKey?: string;

  @IsOptional()
  @Field(() => [ContentLevelEnum], { nullable: true })
  @IsEnum(ContentLevelEnum, { each: true })
  level?: ContentLevelEnum[];
}

@InputType()
export class CourseFilterByAdminInput extends CourseFilterByLecturerInput {
  @IsOptional()
  @IsUUID()
  @Field(() => ID, { nullable: true })
  userIdOfLecturer?: string;
}

@InputType()
export class CourseSortInput {
  @IsOptional()
  @Field(() => CourseSortEnum, { nullable: true })
  sortBy?: CourseSortEnum;

  @IsOptional()
  @Field(() => SortTypeEnum, { nullable: true })
  sortType?: SortTypeEnum;
}

@InputType()
export class CoursesSortSiteInput extends PickType(CourseSortInput, [
  'sortType'
]) {
  @Field(() => CoursesSiteSortEnum)
  sortBy?: CoursesSiteSortEnum;
}

@ArgsType()
export class CoursesBoardSortInput {
  @IsOptional()
  @Field({ nullable: true })
  sort: CourseSortInput;
}

@ArgsType()
export class CoursesBoardByAdminFilterInput {
  @IsOptional()
  @ValidateNested(CourseFilterByAdminInput)
  @Field({ nullable: true })
  filter: CourseFilterByAdminInput;
}
@ArgsType()
export class CoursesBoardByLecturerFilterInput {
  @IsOptional()
  @ValidateNested(CourseFilterByLecturerInput)
  @Field({ nullable: true })
  filter: CourseFilterByLecturerInput;
}

@ArgsType()
export class CoursesSiteFilterInput {
  @IsOptional()
  @ValidateNested(CourseFilterBySiteInput)
  @Field({ nullable: true })
  filter: CourseFilterBySiteInput;
}

@ArgsType()
export class CoursesSiteSort {
  @IsOptional()
  @Field({ nullable: true })
  sort: CoursesSortSiteInput;
}
