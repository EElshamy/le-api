import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { User } from '../user/models/user.model';
import { SocialAccountRequiredActionEnum, SocialProvidersEnum } from './social-auth.enum';
import { MaxLength } from 'class-validator';

@ObjectType()
export class SocialRegisterType {
  @Field(() => SocialAccountRequiredActionEnum)
  actionRequired: SocialAccountRequiredActionEnum;

  @Field(() => User, { nullable: true })
  user: User;
}

export type GetProviderUseInfoInput = {
  providerToken: string;
};

export type ProviderUserData = {
  id: string;
  email: string;
};

export type ValidateSocialProviderInput = {
  providerId: string;
  provider: SocialProvidersEnum;
  email?: string;
  authToken: string;
  isManuallyEntered?: boolean;
  phone?: string;
};

@InputType()
export class ProviderAuthInput {
  @Field()
  @MaxLength(1500)
  authToken: string;
}
