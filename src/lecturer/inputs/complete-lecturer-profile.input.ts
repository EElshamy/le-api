import { Field, InputType } from '@nestjs/graphql';
import {
  IsIBAN,
  IsNumberString,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateIf
} from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ValidPhoneNumber } from '../../_common/custom-validator/phone-number-validation';
import { ValidFilePath } from '../../_common/custom-validator/valid-file-path';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { PreferredPaymentMethodEnum } from '../enums/lecturer.enum';

@InputType()
export class CompleteLecturerProfileInput {
  @IsNotBlank()
  @Field()
  @ValidFilePath()
  profilePicture: string;

  @Field()
  @IsNotBlank()
  @MaxLength(5000)
  @MinLength(2)
  enBio: string;

  @Field()
  @IsNotBlank()
  @MaxLength(5000)
  @MinLength(2)
  arBio: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(50)
  @MinLength(2)
  bankName?: string;

  @Field(() => PreferredPaymentMethodEnum)
  preferredPaymentMethod: PreferredPaymentMethodEnum;

  @ValidateIf(
    o =>
      o.preferredPaymentMethod === PreferredPaymentMethodEnum.BANK ||
      !o.preferredPaymentMethod
  )
  @IsIBAN()
  @Field({ nullable: true })
  bankIBAN: string;

  @ValidateIf(
    o =>
      o.preferredPaymentMethod === PreferredPaymentMethodEnum.BANK ||
      !o.preferredPaymentMethod
  )
  @IsNotBlank()
  @MinLength(9)
  @MaxLength(18)
  @IsNumberString()
  @Field({ nullable: true })
  bankAccountNumber: string;

  @ValidateIf(
    o =>
      o.preferredPaymentMethod === PreferredPaymentMethodEnum.VODAFONE_CASH ||
      !o.preferredPaymentMethod
  )
  @ValidPhoneNumber({
    message: ErrorCodeEnum[ErrorCodeEnum.INVALID_VODAFONE_CASH_NUMBER]
  })
  @IsNotBlank()
  @Field({ nullable: true })
  vodafoneCashNumber: string;
}
