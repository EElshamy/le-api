import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsOptional, MaxLength } from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { Transform } from 'class-transformer';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { FieldOfTrainingSortEnum } from '../field-of-training.enum';

@InputType()
export class FieldOfTrainingsBoardFilter {
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
export class FieldOfTrainingsBoardSort {
  @Field(() => FieldOfTrainingSortEnum)
  sortBy: FieldOfTrainingSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class FieldOfTrainingsBoardSortInput {
  @Field({ nullable: true })
  sort: FieldOfTrainingsBoardSort;
}
@ArgsType()
export class FieldOfTrainingsBoardFilterInput {
  @IsOptional()
  @ValidateNested(FieldOfTrainingsBoardFilter)
  @Field({ nullable: true })
  filter: FieldOfTrainingsBoardFilter;
}
