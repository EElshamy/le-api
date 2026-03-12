import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsPositive } from 'class-validator';

@ArgsType()
export class ToolInput {
  @IsPositive()
  @Field(() => Int)
  toolId: number;
}
