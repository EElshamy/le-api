import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { ContentLevelEnum, CourseTypeEnum } from '../enums/course.enum';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { SortEnum } from '@src/_common/graphql/graphql.enum';

export enum CourseUserFilterEnum {
  PROGRESS = 'progress',
  COMPLETED = 'completed'
}

registerEnumType(CourseUserFilterEnum, { name: 'CourseUserFilterEnum' });
@InputType()
export class CourseUserFilterInput {
  @Field(type => CourseUserFilterEnum, { nullable: true })
  @IsEnum(CourseUserFilterEnum)
  progress: CourseUserFilterEnum;

  @Field(type => CourseTypeEnum, { nullable: true })
  @IsEnum(CourseTypeEnum)
  type: CourseTypeEnum;

  @Field(() => String, { nullable: true })
  categoryId: string;

  @Field(type => ContentLevelEnum, { nullable: true })
  @IsEnum(ContentLevelEnum)
  level: ContentLevelEnum;

  @IsOptional()
  @Field(type => Boolean, { nullable: true, defaultValue: false })
  isBlocked: boolean;

  @IsOptional()
  @Field(type => Boolean, { nullable: true, defaultValue: false })
  isDeleted: boolean;

  @IsOptional()
  @Field(() => String, { nullable: true })
  searchKey?: string;
}

@ArgsType()
export class CourseUserFilterArgs {
  @Field(() => CourseUserFilterInput, { nullable: true })
  filter?: CourseUserFilterInput;
}
