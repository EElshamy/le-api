import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsPositive } from 'class-validator';

@ArgsType()
export class SkillInput {
  @IsPositive()
  @Field(() => Int)
  skillId: number;
}
