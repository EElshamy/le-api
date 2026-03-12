import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@ArgsType()
export class JobTitleInput {
  @IsUUID('4')
  @Field(type => ID)
  jobTitleId: string;
}
