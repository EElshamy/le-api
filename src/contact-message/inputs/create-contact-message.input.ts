import { Field, InputType } from '@nestjs/graphql';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';
import {
  ArrayMaxSize,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional
} from 'class-validator';
import { ContactReasonEnum } from '../enums/contact-message.enum';
import { ValidPhoneNumber } from '@src/_common/custom-validator/phone-number-validation';
import { Transform } from 'class-transformer';

@InputType()
export class CreateContactMessageInput {
  @Field({ nullable: true })
  @IsOptional()
  @TextValidation({ minLength: 2, maxLength: 50, allowArabic: true })
  fullname: string;

  @IsEmail()
  @Field({ nullable: true })
  @IsOptional()
  email: string;

  @Transform(val => val.value.replace(/\s+/g, ''))
  @Transform(val => val.value.trim())
  @ValidPhoneNumber()
  @IsOptional()
  @Field({ nullable: true })
  phone?: string;

  @IsNotEmpty()
  @IsEnum(ContactReasonEnum)
  @Field(type => ContactReasonEnum)
  contactReason: ContactReasonEnum;

  @IsNotEmpty()
  @TextValidation({ minLength: 2, maxLength: 50, allowArabic: true })
  @Field()
  subject: string;

  @IsNotEmpty()
  @TextValidation({ minLength: 2, maxLength: 10000, allowArabic: true })
  @Field()
  message: string;

  @IsOptional()
  @Field(() => [String], { nullable: 'itemsAndList' })
  @ArrayMaxSize(5)
  attachments: string[];
}
