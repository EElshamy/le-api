import { IsNotEmpty, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { SocialProvidersEnum } from '../social-auth.enum';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';

@InputType()
export class DisconnectSocialAccountInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  providerId: string;

  @Field(type => SocialProvidersEnum)
  @IsNotEmpty()
  provider: SocialProvidersEnum;
}
