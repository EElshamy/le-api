import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, Max, Min } from 'class-validator';

@InputType()
export class BlogsFilter {
  @IsOptional()
  @Min(2)
  @Max(25)
  @Field({ nullable: true })
  searchKey?: string;

  @IsOptional()
  @Field({ nullable: true })
  lecturerId?: string;

  @IsOptional()
  @Field(() => [Int], { nullable: true })
  categoryIds?: number[];

  @IsOptional()
  @Field(() => String, { nullable: true })
  categorySlug?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  TagSlug?: string;

  @IsOptional()
  @Field(() => [Int], { nullable: true })
  tagIds?: number[];
}

@ArgsType()
export class BlogsFilterInput {
  @IsOptional()
  @Field(type => BlogsFilter, { nullable: true })
  filter?: BlogsFilter;
}
