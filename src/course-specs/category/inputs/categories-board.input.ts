import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { CategorySortEnum } from '../category.enum';
import { IsNotBlank } from '../../../_common/custom-validator/not-bank.validator';
import { SortTypeEnum } from '../../../_common/paginator/paginator.types';
import { ValidateNested } from '../../../_common/custom-validator/validate-nested.decorator';

@InputType()
export class CategoriesBoardFilter {
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
export class CategoriesBoardSort {
  @Field(() => CategorySortEnum)
  sortBy: CategorySortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class CategoriesBoardSortInput {
  @Field({ nullable: true })
  sort: CategoriesBoardSort;
}

@ArgsType()
export class CategoriesBoardFilterInput {
  @IsOptional()
  @ValidateNested(CategoriesBoardFilter)
  @Field({ nullable: true })
  filter: CategoriesBoardFilter;
}
