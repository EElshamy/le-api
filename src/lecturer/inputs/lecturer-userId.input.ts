import { ArgsType, Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@ArgsType()
export class LecturerUserIdInput {
  @IsUUID('4')
  @Field(type => ID)
  userIdOfLecturer: string;
}

@InputType()
export class LecturerIdInput {
  @Field(type => ID)
  @IsUUID('4')
  lecturerId: string;
}
