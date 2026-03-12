import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { IsOptional } from 'class-validator';
import { SecurityGroupSortEnum } from '../enums/security-group-sort.enum';
@InputType()
export class SecurityGroupSortInput {
  @Field(() => SecurityGroupSortEnum, {
    defaultValue: SecurityGroupSortEnum.CREATED_AT
  })
  sortBy: SecurityGroupSortEnum;

  @Field(() => SortTypeEnum, { defaultValue: SortTypeEnum.DESC })
  sortType: SortTypeEnum;
}

@ArgsType()
export class SecurityGroupSortBoardArgs {
  @IsOptional()
  @Field(type => SecurityGroupSortInput, { nullable: true })
  sort?: SecurityGroupSortInput;
}
