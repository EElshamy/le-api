import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { EmailValidationConditions } from '../auth.constants';
import { Transform } from 'class-transformer';

@InputType()
export class VerifyForgetPasswordInput {
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
}
