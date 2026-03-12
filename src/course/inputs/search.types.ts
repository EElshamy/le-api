import {
  ArgsType,
  Field,
  InputType,
  Int,
  registerEnumType
} from '@nestjs/graphql';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { IsOptional } from 'class-validator';
import { ContentLevelEnum } from '../enums/course.enum';

//todo .. add other types (diploma , workshop etc)
// export const SearchUnionType = createUnionType({
//   name: 'SearchUnionType',
//   types: () => [Course, ..] as const,
//   resolveType(value) {
//     if (value.categoryId) {
//       return Course;
//     }
//     if (value...) {
//       return ..;
//     }
//     if (value...) {
//       return ..;
//     }
//     return null;
//   }
// });

export enum SearchSortByEnum {
  CREATED_AT = 'createdAt'
}
registerEnumType(SearchSortByEnum, { name: 'SearchSortByEnum' });

export enum ExploreSortByEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

registerEnumType(ExploreSortByEnum, { name: 'ExploreSortByEnum' });

@InputType()
export class SearchFilter {
  @Field({ nullable: true })
  searchKey?: string;
  @Field({ nullable: true })
  categoryId?: string;
  @Field(() => ContentLevelEnum, { nullable: true })
  level: ContentLevelEnum;
  @Field(() => Int, { nullable: true })
  price?: number;
  @Field(() => Int, { nullable: true })
  learningTime?: number;
}

@InputType()
export class SearchSort {
  @Field(() => SearchSortByEnum, {
    nullable: true,
    defaultValue: SearchSortByEnum.CREATED_AT
  })
  sortBy: SearchSortByEnum;

  @Field(() => SortTypeEnum, {
    nullable: true,
    defaultValue: SortTypeEnum.DESC
  })
  sortType: SortTypeEnum;
}

@ArgsType()
export class SearchFilterInput {
  @IsOptional()
  @Field({ nullable: true })
  filter: SearchFilter;
}
@ArgsType()
export class SearchSortInput {
  @IsOptional()
  @Field({ nullable: true })
  sort: SearchSort;
}

@InputType()
export class ExploreSort {
  @Field(() => ExploreSortByEnum, {
    nullable: true,
    defaultValue: ExploreSortByEnum.UPDATED_AT
  })
  sortBy: ExploreSortByEnum;

  @Field(() => SortTypeEnum, {
    nullable: true,
    defaultValue: SortTypeEnum.DESC
  })
  sortType: SortTypeEnum;
}

@ArgsType()
export class ExploreInput {
  @IsOptional()
  @Field(() => ExploreSort, { nullable: true })
  sort?: ExploreSort;

  @IsOptional()
  @Field(() => Int, { nullable: true, defaultValue: 4 })
  popularCoursesLimit?: number;

  @IsOptional()
  @Field(() => Int, { nullable: true, defaultValue: 4 })
  latestWorkshopsLimit?: number;

  @IsOptional()
  @Field(() => Int, { nullable: true, defaultValue: 4 })
  pathDiplomasLimit?: number;

  @IsOptional()
  @Field(() => Int, { nullable: true, defaultValue: 4 })
  subscriptionDiplomasLimit?: number;

  @IsOptional()
  @Field(() => Int, { nullable: true, defaultValue: 4 })
  liveCoursesLimit?: number;
}
