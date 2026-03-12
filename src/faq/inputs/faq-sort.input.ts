import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { FaqSortEnum } from '../enums/faq-sort.enum';

@InputType()
export class FaqSortInput {
  @Field(() => FaqSortEnum)
  sortBy: FaqSortEnum;

  @Field(() => SortTypeEnum, {
    nullable: true,
    defaultValue: SortTypeEnum.DESC
  })
  sortType: SortTypeEnum;
}

@ArgsType()
export class FaqSortArgs {
  @Field(() => FaqSortInput, { nullable: true })
  sort?: FaqSortInput;
}
