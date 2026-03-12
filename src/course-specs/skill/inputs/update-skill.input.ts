import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateSkillInput } from './create-skill.input';
import { IsPositive } from 'class-validator';

@InputType()
export class UpdateSkillInput extends PartialType(CreateSkillInput) {
  @IsPositive()
  @Field(() => Int)
  skillId: number;
}
