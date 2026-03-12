import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import { LecturersBoardSortEnum } from '../enums/lecturer.enum';

@InputType()
export class LecturersBoardSort {
  @Field(() => LecturersBoardSortEnum)
  sortBy: LecturersBoardSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class LecturersBoardSortInput {
  @Field({ nullable: true })
  sort: LecturersBoardSort;
}

@InputType()
export class LecturersBoardFilter {
  @IsOptional()
  @Field(() => String, { nullable: true })
  @IsNotBlank()
  searchKey?: string;

  @Field({ nullable: true })
  activeOnly?: boolean;
}

@ArgsType()
export class LecturersBoardFilterInput {
  @ValidateNested(LecturersBoardFilter)
  @IsOptional()
  @Field(() => LecturersBoardFilter, { nullable: true })
  filter: LecturersBoardFilter;
}
