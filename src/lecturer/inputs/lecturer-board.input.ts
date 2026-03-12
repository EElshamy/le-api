import { ArgsType, Field, ID } from '@nestjs/graphql';
import { ValidateIf, Matches, IsUUID } from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';

@ArgsType()
export class LecturerUserIdOrCodeBoardInput {
  @ValidateIf(o => !o.code && !o.lecturerId)
  @IsUUID('4')
  @IsNotBlank()
  @Field(type => ID, { nullable: true })
  userIdOfLecturer?: string;

  @ValidateIf(o => !o.userIdOfLecturer && !o.lecturerId)
  @Matches(/^L-\d{8}$/, { message: 'Invalid lecturer code' })
  @Field(type => String, { nullable: true })
  code?: string;

  @ValidateIf(o => !o.userIdOfLecturer && !o.code)
  @IsUUID('4')
  @IsNotBlank()
  @Field(type => ID, { nullable: true })
  lecturerId?: string;
}
