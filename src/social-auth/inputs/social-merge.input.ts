import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { LoginDetailsInput } from '../../user-sessions/inputs/login-details.input';
import { SocialProvidersEnum } from '../social-auth.enum';
import { EmailValidationConditions } from '../../auth/auth.constants';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { Transform } from 'class-transformer';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ProviderAuthInput } from '../social-auth.type';

@InputType()
export class SocialMergeInput {
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

  @ValidateNested(LoginDetailsInput)
  @Field(() => LoginDetailsInput)
  loginDetails?: LoginDetailsInput;

  @ValidateNested(ProviderAuthInput)
  @Field(() => ProviderAuthInput)
  providerAuth: ProviderAuthInput;
}
