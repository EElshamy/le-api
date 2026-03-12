import { Field, ID, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsUUID } from 'class-validator';
import { PasswordValidator } from '../../_common/custom-validator/password-validator.decorator';
import { EmailValidationConditions } from '../../auth/auth.constants';
import { ValidateName } from '../../auth/decorators/name-decorator';
import { IsNotBlank } from '@src/_common/custom-validator/not-bank.validator';
import { ValidFilePath } from '@src/_common/custom-validator/valid-file-path';
import { ValidPhoneNumber } from '@src/_common/custom-validator/phone-number-validation';

@InputType()
export class UpdateUserBoardInput {
  @IsUUID('4')
  @Field(type => ID, { nullable: true })
  userId: string;

  @IsOptional()
  @Field({ nullable: true })
  @ValidateName()
  firstName: string;

  @IsOptional()
  @Field({ nullable: true })
  @ValidateName()
  lastName: string;

  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @IsOptional()
  @Field({ nullable: true })
  email: string;

  @IsOptional()
  @Field({ nullable: true })
  @PasswordValidator()
  password: string;

  @IsOptional()
  @IsNotBlank()
  @ValidFilePath()
  @Field({ nullable: true })
  profilePicture?: string;

  @Transform(val => val.value.replace(/\s+/g, ''))
  @Transform(val => val.value.trim())
  @ValidPhoneNumber()
  @IsOptional()
  @Field({ nullable: true })
  phone?: string;
}
