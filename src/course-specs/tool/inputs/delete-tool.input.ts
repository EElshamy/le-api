import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsPositive } from 'class-validator';

@InputType()
export class DeleteToolInput {
  @IsPositive()
  @Field(() => Int)
  toolId: number;

  @IsOptional()
  @IsPositive()
  @Field(() => Int, { nullable: true })
  reassignToToolId: number;
}
