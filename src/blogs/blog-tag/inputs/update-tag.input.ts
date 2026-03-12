import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsPositive } from 'class-validator';
import { CreateTagInput } from './create-blog-tag.input';

@InputType()
export class UpdateTagInput extends PartialType(CreateTagInput) {
  @IsNotEmpty()
  @IsPositive()
  @Field(type => Int)
  tagId: number;
}
