import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { CreateLecturerBoardInput } from './create-lecturer-board.input';
import { IsOptional, IsUUID } from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ValidFilePath } from '../../_common/custom-validator/valid-file-path';

@InputType()
export class UpdateLecturerBoardInput extends PartialType(CreateLecturerBoardInput) {
  @IsUUID('4')
  @Field(type => ID)
  userIdOfLecturer: string;

  @ValidFilePath()
  @Field({ nullable: true })
  @IsOptional()
  @IsNotBlank()
  cvUrl: string;
}
