import { ArgsType, Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsUUID, Max, Min } from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import {
  LecturerRequestSubmissionStatusEnum,
  LecturersRequestsBoardSortEnum
} from '../enums/lecturer.enum';

@InputType()
export class LecturerRequestYearRangeInput {
  @Min(0)
  @Max(50)
  @Field(() => Int)
  minYear: number;

  @Min(0)
  @Max(50)
  @Field(() => Int)
  maxYear: number;
}

@InputType()
export class LecturerRequestsBoardSort {
  @Field(() => LecturersRequestsBoardSortEnum)
  sortBy: LecturersRequestsBoardSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class LecturerRequestsBoardSortInput {
  @Field(() => LecturerRequestsBoardSort, { nullable: true })
  sort: LecturerRequestsBoardSort;
}

@InputType()
export class LecturerRequestsBoardFilter {
  @IsOptional()
  @Field(() => String, { nullable: true })
  @IsNotBlank()
  searchKey?: string;

  @Field(() => [LecturerRequestSubmissionStatusEnum], { nullable: true })
  status?: LecturerRequestSubmissionStatusEnum[];

  @IsOptional()
  @Field(() => [ID], { nullable: true })
  @IsUUID('4', { each: true })
  fieldOfTrainigIds?: string;

  @IsOptional()
  @Field(() => ID, { nullable: true })
  @IsUUID('4')
  jobTitleId?: string;

  @IsOptional()
  @ValidateNested(LecturerRequestYearRangeInput, { each: true })
  @Field(() => [LecturerRequestYearRangeInput], { nullable: true })
  yearsOfExperienceRange?: LecturerRequestYearRangeInput[];
}

@ArgsType()
export class LecturerRequestsBoardFilterInput {
  @ValidateNested(LecturerRequestsBoardFilter)
  @Field(() => LecturerRequestsBoardFilter, { nullable: true })
  filter: LecturerRequestsBoardFilter;
}
