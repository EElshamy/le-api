import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsPositive } from 'class-validator';

@InputType()
export class DeleteSkillInput {
  @IsPositive()
  @Field(() => Int)
  skillId: number;

  @IsOptional()
  @IsPositive()
  @Field(() => Int, { nullable: true })
  reassignToSkillId: number;
}
