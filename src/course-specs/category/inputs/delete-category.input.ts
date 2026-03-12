import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsPositive } from 'class-validator';

@InputType()
export class DeleteCategoryInput {
  @IsPositive()
  @Field(() => Int)
  categoryId: number;

  @IsOptional()
  @IsPositive()
  @Field(() => Int, { nullable: true })
  reassignToCategoryId: number;
}
