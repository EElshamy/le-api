import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsPositive } from 'class-validator';

@ArgsType()
export class CategoryInput {
  @IsNotEmpty()
  @IsPositive()
  @Field(type => Int)
  categoryId: number;
}
