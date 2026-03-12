import { Field, InputType, Int, IntersectionType, OmitType } from '@nestjs/graphql';
import { LecturerAttributesInput } from '../../auth/inputs/register-as-lecturer.input';
import { IsNotEmpty, IsUrl, Max, Min } from 'class-validator';
import { CompleteLecturerProfileInput } from './complete-lecturer-profile.input';

@InputType()
export class CreateLecturerBoardInput extends OmitType(
  IntersectionType(LecturerAttributesInput, CompleteLecturerProfileInput),
  ['cvUrl']
) {
  @Field()
  @IsNotEmpty()
  @IsUrl()
  uploadedMaterialUrl: string;

  @Field(() => Int)
  @Min(0)
  @Max(100)
  commissionPercentage: number;
}
