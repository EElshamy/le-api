import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { LoginDetailsInput } from '../../user-sessions/inputs/login-details.input';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { SocialProvidersEnum } from '../social-auth.enum';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';

@InputType()
export class SocialLoginInput {
  @Field()
  @IsString()
  @IsNotBlank()
  @IsNotEmpty()
  providerId: string;

  @Field(type => SocialProvidersEnum)
  @IsNotEmpty()
  provider: SocialProvidersEnum;

  @ValidateNested(LoginDetailsInput)
  @Field(() => LoginDetailsInput)
  loginDetails?: LoginDetailsInput;
}
