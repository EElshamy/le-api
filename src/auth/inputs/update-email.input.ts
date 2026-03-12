import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { EmailValidationConditions } from '../auth.constants';
import { IsEmail } from 'class-validator';
import { PasswordValidator } from '../../_common/custom-validator/password-validator.decorator';

@InputType()
export class UpdateEmailInput {
  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @Field()
  email: string;

  @Field()
  @PasswordValidator()
  password: string;
}

@InputType()
export class UpdateEmailBoardInput {
  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @Field()
  email: string;
}
