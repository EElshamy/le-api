import { InputType, Field } from '@nestjs/graphql';
import { PasswordValidator } from '../../_common/custom-validator/password-validator.decorator';

@InputType()
export class SetLecturerPasswordInput {
  @Field()
  @PasswordValidator()
  password: string;
}
