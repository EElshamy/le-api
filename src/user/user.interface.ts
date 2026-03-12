import { User } from './models/user.model';
import {
  DeviceEnum,
  UserVerificationCodeUseCaseEnum,
  VerificationCodeDestination
} from './user.enum';
import { FcmTokensType } from './user.type';

export interface FcmTokenTransformerInput {
  fcmToken?: string;
  device?: DeviceEnum;
  userSavedFcmTokens?: FcmTokensType;
}

export interface LastLoginDetailsTransformerInput {
  device?: DeviceEnum;
  platformDetails?: object;
}

export interface LongLatTransformerInput {
  long?: number;
  lat?: number;
}

export interface VerificationCodeAndExpirationDate {
  verificationCode: string;
  expiryDate: Date;
}

export interface ValidVerificationCodeOrErrorInput {
  user: User;
  verificationCode: string;
  useCase: UserVerificationCodeUseCaseEnum;
}

export interface DeleteVerificationCodeAndUpdateUserModelInput {
  user: User;
  useCase: UserVerificationCodeUseCaseEnum;
}

export interface UserByPhoneBasedOnUseCaseOrErrorInput {
  phone: string;
  useCase: UserVerificationCodeUseCaseEnum;
}
export interface UserByEmailBasedOnUseCaseOrErrorInput {
  email: string;
  useCase: UserVerificationCodeUseCaseEnum;
  destination?: VerificationCodeDestination;
}
