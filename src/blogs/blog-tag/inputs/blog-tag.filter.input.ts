import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class BlogTagsFilterBoard {
  @IsOptional()
  @Field({ nullable: true })
  searchKey?: string;

  @Field({ nullable: true })
  isActive?: boolean;
}

@ArgsType()
export class BlogTagsFilterBoardInput {
  @IsOptional()
  @Field(type => BlogTagsFilterBoard, { nullable: true })
  filter?: BlogTagsFilterBoard;
}
