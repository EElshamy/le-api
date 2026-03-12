import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { IsEnum } from 'class-validator';

export enum UserCourseSortEnum {
  CREATED_AT = 'createdAt',
  LAST_ACTIVE_AT = 'lastActiveAt'
}

registerEnumType(UserCourseSortEnum, { name: 'UserCourseSortEnum' });
@InputType()
export class CourseUserSortInput {
  @Field(() => UserCourseSortEnum)
  @IsEnum(UserCourseSortEnum)
  sortBy: UserCourseSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class CourseUserSortArgs {
  @Field(() => CourseUserSortInput, { nullable: true })
  sort?: CourseUserSortInput;
}
