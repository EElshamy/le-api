import { LecturerAttributesInput } from '../../auth/inputs/register-as-lecturer.input';
import { IsUUID } from 'class-validator';
import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
@InputType()
export class UpdateLecturerRequestBoardInput extends PartialType(LecturerAttributesInput) {
  @IsUUID('4')
  @Field(type => ID)
  lecturerRequestId: string;
}
