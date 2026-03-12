import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateToolInput } from './create-tool.input';
import { IsPositive } from 'class-validator';

@InputType()
export class UpdateToolInput extends PartialType(CreateToolInput) {
  @IsPositive()
  @Field(() => Int)
  toolId: number;
}
