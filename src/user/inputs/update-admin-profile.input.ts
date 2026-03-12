import { Field, InputType } from '@nestjs/graphql';
import { IsNotBlank } from '@src/_common/custom-validator/not-bank.validator';
import { PasswordValidator } from '@src/_common/custom-validator/password-validator.decorator';
import { ValidFilePath } from '@src/_common/custom-validator/valid-file-path';
import { EmailValidationConditions } from '@src/auth/auth.constants';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional } from 'class-validator';
import { ValidateName } from '../../auth/decorators/name-decorator';

@InputType()
export class UpdateAdminProfileInput {
  @IsNotBlank()
  @ValidFilePath()
  @IsOptional()
  @Field({ nullable: true })
  profilePicture: string;

  @Field({ nullable: true })
  @IsOptional()
  @ValidateName()
  firstName?: string;

  @IsOptional()
  @ValidateName()
  @Field({ nullable: true })
  lastName?: string;

  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @IsOptional()
  @Field({ nullable: true })
  email: string;

  @IsOptional()
  @Field({ nullable: true })
  @PasswordValidator()
  password: string;
}
