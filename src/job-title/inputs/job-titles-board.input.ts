import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsOptional, MaxLength } from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { Transform } from 'class-transformer';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { JobTitleSortEnum } from '../job-title.enum';

@InputType()
export class JobTitlesBoardFilter {
  @Field({ nullable: true })
  isActive?: boolean;

  @IsOptional()
  @IsNotBlank()
  @MaxLength(70)
  @Transform(val => val.value.trim())
  @Field({ nullable: true })
  searchKey?: string;
}

@InputType()
export class JobTitlesBoardSort {
  @Field(() => JobTitleSortEnum)
  sortBy: JobTitleSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class JobTitlesBoardSortInput {
  @Field({ nullable: true })
  sort: JobTitlesBoardSort;
}
@ArgsType()
export class JobTitlesBoardFilterInput {
  @IsOptional()
  @ValidateNested(JobTitlesBoardFilter)
  @Field({ nullable: true })
  filter: JobTitlesBoardFilter;
}
