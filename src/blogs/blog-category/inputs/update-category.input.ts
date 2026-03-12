import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsPositive } from 'class-validator';
import { CreateBlogCategoryInput } from './create-category.input';

@InputType()
export class UpdateBlogCategoryInput extends PartialType(
  CreateBlogCategoryInput
) {
  @IsNotEmpty()
  @IsPositive()
  @Field(type => Int)
  categoryId: number;
}
