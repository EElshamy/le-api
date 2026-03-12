import { registerEnumType } from '@nestjs/graphql';

export enum ApprovalStatusEnum {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}
registerEnumType(ApprovalStatusEnum, { name: 'ApprovalStatusEnum' });

export enum LecturerRequestSubmissionStatusEnum {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}
registerEnumType(LecturerRequestSubmissionStatusEnum, {
  name: 'LecturerRequestSubmissionStatusEnum'
});

export enum LecturerTypeEnum {
  DOCTOR = 'DOCTOR',
  CAPTAIN = 'CAPTAIN'
}
registerEnumType(LecturerTypeEnum, { name: 'LecturerTypeEnum' });

export enum ReplyLecturerRequestStatusEnum {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
registerEnumType(ReplyLecturerRequestStatusEnum, {
  name: 'ReplyLecturerRequestStatusEnum'
});

export enum PreferredPaymentMethodEnum {
  BANK = 'BANK',
  VODAFONE_CASH = 'VODAFONE_CASH'
}
registerEnumType(PreferredPaymentMethodEnum, {
  name: 'PreferredPaymentMethodEnum'
});

export enum LecturersBoardSortEnum {
  LAST_ACTIVE = 'lastActiveAt',
  CREATED_AT = 'createdAt',
  REVENUE = 'revenue'
}
registerEnumType(LecturersBoardSortEnum, { name: 'LecturersBoardSortEnum' });

export enum LecturersRequestsBoardSortEnum {
  CREATED_AT = 'createdAt'
}
registerEnumType(LecturersRequestsBoardSortEnum, {
  name: 'LecturersRequestsBoardSortEnum'
});
