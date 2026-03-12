import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class BlogCategoriesFilterBoard {
  @IsOptional()
  @Field({ nullable: true })
  searchKey?: string;

  @Field({ nullable: true })
  isActive?: boolean;
}

@ArgsType()
export class BlogCategoriesFilterBoardInput {
  @IsOptional()
  @Field(type => BlogCategoriesFilterBoard, { nullable: true })
  filter?: BlogCategoriesFilterBoard;
}
