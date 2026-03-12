import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { ReportSortEnum } from '../enums/report-sort.enum';

@InputType()
export class ReportSortInput {
  @Field(() => ReportSortEnum)
  sortBy: ReportSortEnum;

  @Field(() => SortTypeEnum, {
    nullable: true,
    defaultValue: SortTypeEnum.DESC
  })
  sortType: SortTypeEnum;
}

@ArgsType()
export class ReportSortArgs {
  @Field(() => ReportSortInput, { nullable: true })
  sort?: ReportSortInput;
}
