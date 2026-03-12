import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ToolSortEnum } from '../tool.enum';
import { IsNotBlank } from '../../../_common/custom-validator/not-bank.validator';
import { SortTypeEnum } from '../../../_common/paginator/paginator.types';
import { ValidateNested } from '../../../_common/custom-validator/validate-nested.decorator';

@InputType()
export class ToolsBoardFilter {
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
export class ToolsBoardSort {
  @Field(() => ToolSortEnum)
  sortBy: ToolSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class ToolsBoardSortInput {
  @Field({ nullable: true })
  sort: ToolsBoardSort;
}

@ArgsType()
export class ToolsBoardFilterInput {
  @IsOptional()
  @ValidateNested(ToolsBoardFilter)
  @Field({ nullable: true })
  filter: ToolsBoardFilter;
}
