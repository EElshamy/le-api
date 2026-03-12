import { Field, InputType, Int } from '@nestjs/graphql';
import { PasswordValidator } from '@src/_common/custom-validator/password-validator.decorator';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEmail,
  IsISO31661Alpha2,
  IsOptional,
  IsUUID,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';
import { Transaction } from 'sequelize';
import { ValidateLanguage } from '../../_common/custom-validator/lang-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ValidPhoneNumber } from '../../_common/custom-validator/phone-number-validation';
import { ValidFilePath } from '../../_common/custom-validator/valid-file-path';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { LoginDetailsInput } from '../../user-sessions/inputs/login-details.input';
import { LangEnum } from '../../user/user.enum';
import { EmailValidationConditions } from '../auth.constants';
import { LecturerTypeEnum } from '@src/lecturer/enums/lecturer.enum';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';

@InputType()
export class LecturerAttributesInput {
  @IsNotBlank()
  // @ValidateLanguage(LangEnum.AR)
  @TextValidation({
    minLength: 2,
    maxLength: 50,
    allowArabic: true
    // disallowedChars: ['<', '>', '-']
  })
  @Field()
  arFullName: string;

  @IsNotBlank()
  @TextValidation({
    minLength: 2,
    maxLength: 50,
    allowArabic: true
    // disallowedChars: ['<', '>', '-']
  })
  @Field()
  // @ValidateLanguage(LangEnum.EN)
  enFullName: string;

  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @Field()
  email: string;

  @Field()
  @PasswordValidator()
  password: string;

  @Transform(val => val.value.replace(/\s+/g, ''))
  @Transform(val => val.value.trim())
  @ValidPhoneNumber()
  @Field()
  phone: string;

  @Field()
  @IsISO31661Alpha2()
  nationality: string;

  @Field()
  @IsISO31661Alpha2()
  country: string;

  @Field(() => [String])
  @IsUUID('4', { each: true })
  @ArrayMaxSize(6)
  @ArrayMinSize(1)
  fieldOfTrainingIds: string[];

  @Field()
  @IsUUID('4')
  jobTitleId: string;

  @Min(0)
  @Max(50)
  @Field(() => Int)
  yearsOfExperience: number;

  @Field(() => LecturerTypeEnum, { nullable: true })
  lecturerType: LecturerTypeEnum;

  @IsOptional()
  @Field({ nullable: true })
  @MinLength(2)
  @Matches(/linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/, {
    message: ErrorCodeEnum[ErrorCodeEnum.INVALID_LINKEDIN_URL]
  })
  @IsUrl()
  linkedInUrl: string;

  @IsOptional()
  @Field({ nullable: true })
  @MinLength(2)
  @Matches(/instagram\.com\/[a-zA-Z0-9._]+\/?/, {
    message: ErrorCodeEnum[ErrorCodeEnum.INVALID_INSTAGRAM_URL]
  })
  @IsUrl()
  instagramUrl: string;

  @IsOptional()
  @MinLength(2)
  @Matches(/(?:facebook\.com|fb\.com)\/[a-zA-Z0-9_-]+\/?/, {
    message: ErrorCodeEnum[ErrorCodeEnum.INVALID_FACEBOOK_URL]
  })
  @IsUrl()
  @Field({ nullable: true })
  facebookUrl: string;

  @ValidFilePath()
  @Field()
  @IsNotBlank()
  cvUrl: string;
}

@InputType()
export class RegisterAsLecturerInput extends LecturerAttributesInput {
  transaction?: Transaction;

  userId?: string;

  @ValidateNested(LoginDetailsInput)
  @Field(() => LoginDetailsInput)
  loginDetails: LoginDetailsInput;
}
