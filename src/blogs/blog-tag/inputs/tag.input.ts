import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsPositive } from 'class-validator';

@ArgsType()
export class TagInput {
  @IsNotEmpty()
  @IsPositive()
  @Field(type => Int)
  tagId: number;
}
