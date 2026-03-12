import { registerEnumType } from '@nestjs/graphql';

export enum SocialAccountEmailStatus {
  EXISTS_MANUAL = 'EXISTS_MANUAL',
  EXISTS_PROVIDED = 'EXISTS_PROVIDED',
  DOESNT_EXIST_MANUAL = 'DOESNT_EXIST_MANUAL',
  DOESNT_EXIST_PROVIDED = 'DOESNT_EXIST_PROVIDED'
}

export enum SocialAccountRequiredActionEnum {
  REGISTER_VERIFICATION = 'REGISTER_VERIFICATION',
  REGISTER = 'REGISTER',
  MERGE = 'MERGE',
  MERGE_SAME_PROVIDER = 'MERGE_SAME_PROVIDER',
  VERIFICATION_MERGE_SAME_PROVIDER = 'VERIFICATION_MERGE_SAME_PROVIDER',
  VERIFICATION_MERGE = 'VERIFICATION_MERGE'
}
registerEnumType(SocialAccountRequiredActionEnum, { name: 'SocialAccountRequiredActionEnum' });


export enum SocialProvidersEnum {
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE'
}
registerEnumType(SocialProvidersEnum, { name: 'SocialProvidersEnum' });
