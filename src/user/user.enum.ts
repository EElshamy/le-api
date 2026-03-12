import { registerEnumType } from '@nestjs/graphql';

export enum UserRoleEnum {
  USER = 'USER',
  LECTURER = 'LECTURER',
  ADMIN = 'ADMIN'
}
registerEnumType(UserRoleEnum, { name: 'UserRoleEnum' });

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}
registerEnumType(GenderEnum, { name: 'GenderEnum' });

export enum LangEnum {
  EN = 'EN',
  AR = 'AR'
}
registerEnumType(LangEnum, { name: 'LangEnum' });

export enum DeviceEnum {
  DESKTOP = 'DESKTOP',
  IOS = 'IOS',
  ANDROID = 'ANDROID'
}
registerEnumType(DeviceEnum, { name: 'DeviceEnum' });

export enum UserVerificationCodeUseCaseEnum {
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  LECTURER_EMAIL_VERIFICATION = 'LECTURER_EMAIL_VERIFICATION',
  EMAIL_UPDATE = 'EMAIL_UPDATE',
  SOCIAL_EMAIL_VERIFICATION = 'SOCIAL_EMAIL_VERIFICATION'
}
registerEnumType(UserVerificationCodeUseCaseEnum, {
  name: 'UserVerificationCodeUseCaseEnum'
});

export enum VerificationCodeUseCasesEnum {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  EMAIL_UPDATE = 'EMAIL_UPDATE',
  SOCIAL_EMAIL_VERIFICATION = 'SOCIAL_EMAIL_VERIFICATION'
}
registerEnumType(VerificationCodeUseCasesEnum, {
  name: 'VerificationCodeUseCasesEnum'
});

//-----------------------------------------
export enum LecturersEmailUseCaseEnum{
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  REQUEST_APPROVAL = 'REQUEST_APPROVAL',
  REQUEST_REJECTION = 'REQUEST_REJECTION',
  PROGRAM_UPDATED_BY_ADMIN = 'PROGRAM_UPDATED_BY_ADMIN',
}
registerEnumType(LecturersEmailUseCaseEnum, { name: 'LecturersEmailUseCaseEnum' });

export enum UsersEmailUseCaseEnum{
  // EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  // REQUEST_APPROVAL = 'REQUEST_APPROVAL',
  // REQUEST_REJECTION = 'REQUEST_REJECTION',
  // PROGRAM_UPDATED_BY_ADMIN = 'PROGRAM_UPDATED_BY_ADMIN',
}
registerEnumType(UsersEmailUseCaseEnum, { name: 'UsersEmailUseCaseEnum' });
//-----------------------------------------
export enum BoardRoleEnum {
  LECTURER = 'LECTURER',
  ADMIN = 'ADMIN'
}
registerEnumType(BoardRoleEnum, { name: 'BoardRoleEnum' });

export enum UserSortEnum {
  LAST_ACTIVE = 'lastActiveAt',
  CREATED_AT = 'createdAt',
  AMOUNT_SPENT = 'amountSpent'
}
registerEnumType(UserSortEnum, { name: 'UserSortEnum' });

export enum administratorSortEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}
registerEnumType(administratorSortEnum, { name: 'administratorSortEnum' });

export enum VerificationCodeDestination {
  WEBSITE = 'WEBSITE',
  BOARD = 'BOARD'
}
