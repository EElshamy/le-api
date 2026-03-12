import { InputType, IntersectionType, OmitType, PartialType } from '@nestjs/graphql';
import { LecturerAttributesInput } from '../../auth/inputs/register-as-lecturer.input';
import { CompleteLecturerProfileInput } from './complete-lecturer-profile.input';

@InputType()
export class UpdateLecturerProfileInput extends PartialType(
  OmitType(IntersectionType(LecturerAttributesInput, CompleteLecturerProfileInput), [
    'email',
    'cvUrl',
    'linkedInUrl',
    'facebookUrl',
    'instagramUrl'
  ])
) {}
