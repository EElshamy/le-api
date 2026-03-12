import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsEmail } from 'class-validator';
import { EmailValidationConditions } from '../auth.constants';
import { ValidateName } from '../decorators/name-decorator';
import { PasswordValidator } from '../../_common/custom-validator/password-validator.decorator';
import { Transform } from 'class-transformer';
import { LoginDetailsInput } from '../../user-sessions/inputs/login-details.input';
import { IsNotBlank } from '@src/_common/custom-validator/not-bank.validator';
import { ValidFilePath } from '@src/_common/custom-validator/valid-file-path';
import { ValidPhoneNumber } from '@src/_common/custom-validator/phone-number-validation';

@InputType()
export class RegisterInput {
  @Field()
  @ValidateName()
  firstName: string;

  @Field()
  @ValidateName()
  lastName: string;

  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @IsOptional()
  @Field({ nullable: true })
  email: string;

  @Field()
  @PasswordValidator()
  password: string;

  @IsNotBlank()
  @IsOptional()
  @Field({ nullable: true })
  @ValidFilePath()
  profilePicture?: string;

  @Transform(val => val.value.replace(/\s+/g, ''))
  @Transform(val => val.value.trim())
  @ValidPhoneNumber()
  @IsOptional()
  @Field({ nullable: true })
  phone?: string;

  @Field(() => LoginDetailsInput)
  loginDetails: LoginDetailsInput;
}
