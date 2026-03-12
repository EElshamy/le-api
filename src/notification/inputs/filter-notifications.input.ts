import { InputType, Field, ArgsType, registerEnumType } from '@nestjs/graphql';
import { SortEnum } from '@src/_common/graphql/graphql.enum';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { IsString, IsOptional } from 'class-validator';
import { BoardNotificationSortEnum } from '../notification.enum';

@InputType()
export class FilterNotificationsInput {
  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  searchKey?: string;
}

@ArgsType()
export class NullableFilterNotificationsInput {
  @IsOptional()
  @Field(type => FilterNotificationsInput, { nullable: true })
  filter?: FilterNotificationsInput;
}

@InputType()
export class BoardNotificationSortInput {
  @IsOptional()
  @Field(() => BoardNotificationSortEnum, { nullable: true })
  sortBy?: BoardNotificationSortEnum;

  @IsOptional()
  @Field(() => SortTypeEnum, { nullable: true })
  sortType?: SortTypeEnum;
}

@ArgsType()
export class BoardNotificationSortArgs {
  @IsOptional()
  @Field(() => BoardNotificationSortInput, { nullable: true })
  sort?: BoardNotificationSortInput;
}
