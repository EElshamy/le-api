import { IsNotEmpty, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { SocialProvidersEnum } from '../social-auth.enum';
import { ProviderAuthInput } from '../social-auth.type';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';

@InputType()
export class LinkSocialAccountInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @Field(type => SocialProvidersEnum)
  @IsNotEmpty()
  provider: SocialProvidersEnum;

  @ValidateNested(ProviderAuthInput)
  @Field(() => ProviderAuthInput)
  providerAuth: ProviderAuthInput;
}
