import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class LearningProgramFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  searchKey: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  userId: string;
}

@ArgsType()
export class LearningProgramFilterArgs {
  @Field(() => LearningProgramFilterInput, { nullable: true })
  filter: LearningProgramFilterInput;
}
