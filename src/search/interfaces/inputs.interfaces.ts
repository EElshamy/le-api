import { Field, InputType, Int } from '@nestjs/graphql';
import {
  ContentLevelEnum,
  CourseTimeUnit
} from '@src/course/enums/course.enum';
import { SearchSpaceEnum } from '../enums/search-space.enum';

@InputType()
export class LearningTimeFilter {
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  from?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  to?: number;

  @Field(() => CourseTimeUnit, { nullable: true })
  unit?: CourseTimeUnit;
}

@InputType()
export class PriceFilter {
  @Field({ nullable: true, defaultValue: 0 })
  from?: number;

  @Field({ nullable: true, defaultValue: 0 })
  to?: number;
}

@InputType()
export class GeneralSearchFilter {
  @Field({ nullable: true })
  searchKey?: string;

  @Field({ nullable: true })
  lecturerId?: string;

  @Field(() => [Int], { nullable: true })
  categoryIds?: number[];

  @Field(() => SearchSpaceEnum, { nullable: true })
  type?: SearchSpaceEnum;

  @Field(() => [ContentLevelEnum], { nullable: true })
  level?: ContentLevelEnum[];

  @Field(() => PriceFilter, { nullable: true })
  price?: PriceFilter;

  @Field(() => LearningTimeFilter, { nullable: true })
  learningTime?: LearningTimeFilter;

  @Field(() => [String], { nullable: true })
  excludedIds?: string[];

  @Field(() => Boolean, { nullable: true , defaultValue: false})
  isLiveCourse?: boolean;
}
