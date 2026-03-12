import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { SkillSortEnum } from '../skill.enum';
import { IsNotBlank } from '../../../_common/custom-validator/not-bank.validator';
import { SortTypeEnum } from '../../../_common/paginator/paginator.types';
import { ValidateNested } from '../../../_common/custom-validator/validate-nested.decorator';

@InputType()
export class SkillsBoardFilter {
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
export class SkillsBoardSort {
  @Field(() => SkillSortEnum)
  sortBy: SkillSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class SkillsBoardSortInput {
  @Field({ nullable: true })
  sort: SkillsBoardSort;
}

@ArgsType()
export class SkillsBoardFilterInput {
  @IsOptional()
  @ValidateNested(SkillsBoardFilter)
  @Field({ nullable: true })
  filter: SkillsBoardFilter;
}
