import { Field, ID, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateCategoryInput } from './create-category.input';
import { IsPositive } from 'class-validator';

@InputType()
export class UpdateCategoryInput extends PartialType(CreateCategoryInput) {
  @IsPositive()
  @Field(() => Int)
  categoryId: number;
}
