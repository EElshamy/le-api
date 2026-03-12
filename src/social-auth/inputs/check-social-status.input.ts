import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { EmailValidationConditions } from '../../auth/auth.constants';
import { SocialProvidersEnum } from '../social-auth.enum';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ProviderAuthInput } from '../social-auth.type';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';

@InputType()
export class CheckSocialStatusInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  providerId: string;

  @Field(type => SocialProvidersEnum)
  @IsNotEmpty()
  provider: SocialProvidersEnum;

  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @Field()
  email: string;

  @Field({ defaultValue: false })
  isManuallyEntered: boolean;

  @ValidateNested(ProviderAuthInput)
  @Field(() => ProviderAuthInput)
  providerAuth: ProviderAuthInput;
}
