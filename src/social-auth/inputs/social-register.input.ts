import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { ValidateName } from '../../auth/decorators/name-decorator';
import { LoginDetailsInput } from '../../user-sessions/inputs/login-details.input';
import { EmailValidationConditions } from '../../auth/auth.constants';
import { SocialProvidersEnum } from '../social-auth.enum';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { Transform } from 'class-transformer';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ProviderAuthInput } from '../social-auth.type';
import { ValidPhoneNumber } from '@src/_common/custom-validator/phone-number-validation';

@InputType()
export class SocialRegisterInput {
  @Field()
  @IsString()
  @IsNotBlank()
  @IsNotEmpty()
  providerId: string;

  @Field(type => SocialProvidersEnum)
  @IsNotEmpty()
  provider: SocialProvidersEnum;

  @Field()
  @ValidateName()
  firstName: string;

  @ValidateName()
  @Field()
  lastName: string;

  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @Field()
  email: string;

  @Field({ defaultValue: false })
  isManuallyEntered: boolean;

  @ValidateNested(LoginDetailsInput)
  @Field(() => LoginDetailsInput)
  loginDetails: LoginDetailsInput;

  @ValidateNested(ProviderAuthInput)
  @Field(() => ProviderAuthInput)
  providerAuth: ProviderAuthInput;

  @Transform(val => val.value.replace(/\s+/g, ''))
  @Transform(val => val.value.trim())
  @ValidPhoneNumber()
  @IsOptional()
  @Field({ nullable: true })
  phone?: string;
}
