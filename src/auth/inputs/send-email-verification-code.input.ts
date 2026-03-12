import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserVerificationCodeUseCaseEnum } from '../../user/user.enum';
import { EmailValidationConditions } from '../auth.constants';
import { Transform } from 'class-transformer';

@InputType()
export class SendEmailVerificationCodeInput {
  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @IsNotEmpty()
  @Field()
  email: string;

  @IsEnum(UserVerificationCodeUseCaseEnum)
  @IsNotEmpty()
  @Field(type => UserVerificationCodeUseCaseEnum)
  useCase: UserVerificationCodeUseCaseEnum;
}
