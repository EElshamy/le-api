import { Field, ID, InputType } from '@nestjs/graphql';
import { PasswordValidator } from '../../_common/custom-validator/password-validator.decorator';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateLecturerPasswordBoard {
  @IsUUID('4')
  @Field(type => ID)
  userIdOfLecturer: string;

  @Field()
  @PasswordValidator()
  password: string;
}
