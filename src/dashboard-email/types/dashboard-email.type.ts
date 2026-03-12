import { da } from '@faker-js/faker';
import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { SearchSort, SearchSortByEnum } from '@src/course/inputs/search.types';
import { IsEnum, IsOptional } from 'class-validator';
import { dash } from 'pdfkit';

export enum DashboardEmailTypeEnum {
  ALL = 'ALL',
  USERS = 'USERS',
  LECTURERS = 'LECTURERS'
}

registerEnumType(DashboardEmailTypeEnum, { name: 'DashboardEmailTypeEnum' });

// filter
@InputType()
export class DashBoardEmailsFilterInput {
  @Field(type => DashboardEmailTypeEnum, { nullable: true })
  @IsEnum(DashboardEmailTypeEnum)
  target?: DashboardEmailTypeEnum;

  @Field(type => String, { nullable: true })
  searchKey?: string;
}

@ArgsType()
export class DashBoardEmailsFilterArgs {
  @Field(() => DashBoardEmailsFilterInput, { nullable: true })
  filter?: DashBoardEmailsFilterInput;
}

//sort
export enum DashboardEmailSortByEnum {
  TIMES_SENT = 'timesSent',
  CREATED_AT = 'createdAt',
  LAST_SENT_AT = 'lastSentAt'
}

registerEnumType(DashboardEmailSortByEnum, { name: 'DashboardEmailSortByEnum' });

@InputType()
export class DashboardEmailSort {
  @Field(() => DashboardEmailSortByEnum, {
    nullable: true,
    defaultValue: DashboardEmailSortByEnum.CREATED_AT
  })
  sortBy: DashboardEmailSortByEnum;

  @Field(() => SortTypeEnum, {
    nullable: true,
    defaultValue: SortTypeEnum.DESC
  })
  sortType: SortTypeEnum;
}

@ArgsType()
export class DashboardEmailSortInput {
  @IsOptional()
  @Field({ nullable: true })
  sort: DashboardEmailSort;
}
