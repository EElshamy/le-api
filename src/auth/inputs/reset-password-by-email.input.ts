import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsEmail, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { EmailValidationConditions } from '../auth.constants';
import { PasswordValidator } from '../../_common/custom-validator/password-validator.decorator';

@InputType()
export class ResetPasswordByEmailInput {
  @Field()
  @IsNotEmpty()
  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  email: string;

  @Field()
  @MinLength(4)
  @MaxLength(4)
  @IsNotEmpty()
  verificationCode: string;

  @Field()
  @PasswordValidator()
  @IsNotEmpty()
  newPassword: string;
}
