import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { IsOptional } from 'class-validator';
import { BlogSortEnum, BlogStatusEnum } from '../blog.enum';

@InputType()
export class BlogsFilterBoard {
  @IsOptional()
  @Field({ nullable: true })
  searchKey?: string;

  @IsOptional()
  @Field({ nullable: true })
  categoryId?: number;

  @IsOptional()
  @Field({ nullable: true })
  lecturerId?: string;

  @IsOptional()
  @Field(() => BlogStatusEnum, { nullable: true })
  status?: BlogStatusEnum;
}

@InputType()
export class BlogsSortInput {
  @Field(() => BlogSortEnum)
  sortBy: BlogSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class BlogsFilterBoardInput {
  @IsOptional()
  @Field(type => BlogsFilterBoard, { nullable: true })
  filter?: BlogsFilterBoard;
}
@ArgsType()
export class BlogsSortBoardInput {
  @IsOptional()
  @Field(type => BlogsSortInput, { nullable: true })
  sort?: BlogsSortInput;
}
