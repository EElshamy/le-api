import { ArgsType, Field } from '@nestjs/graphql';
import { Matches } from 'class-validator';

@ArgsType()
export class LecturerRequestInput {
  @Matches(/^L-\d{8}$/, { message: 'Invalid lecturer code' })
  @Field(type => String)
  lecturerCode: string;
}
