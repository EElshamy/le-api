import { registerEnumType } from '@nestjs/graphql';

export enum PublicationStatusEnum {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}
registerEnumType(PublicationStatusEnum, { name: 'PublicationStatusEnum' });

export enum CourseStatusEnum {
  DRAFTED = 'DRAFTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  UPDATED = 'UPDATED',
  PREVIEWED = 'PREVIEWED'
}
registerEnumType(CourseStatusEnum, { name: 'CourseStatusEnum' });

export enum CourseApprovalStatusFilterEnum {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}
registerEnumType(CourseApprovalStatusFilterEnum, {
  name: 'CourseStatusFilterEnum'
});

export enum SyllabusCreationMethodEnum {
  MANUALLY = 'MANUALLY',
  EXTERNAL_LINK = 'EXTERNAL_LINK'
}
registerEnumType(SyllabusCreationMethodEnum, {
  name: 'SyllabusCreationMethodEnum'
});

export enum CourseTypeEnum {
  COURSE = 'COURSE',
  WORKSHOP = 'WORKSHOP'
}
registerEnumType(CourseTypeEnum, { name: 'CourseTypeEnum' });

export enum ContentLevelEnum {
  BEGINNER = 'BEGINNER',
  BEGINNER_INTERMEDIATE = 'BEGINNER_INTERMEDIATE',
  BEGINNER_ADVANCED = 'BEGINNER_ADVANCED',
  INTERMEDIATE = 'INTERMEDIATE',
  INTERMEDIATE_ADVANCED = 'INTERMEDIATE_ADVANCED',
  ADVANCED = 'ADVANCED'
}
registerEnumType(ContentLevelEnum, { name: 'ContentLevelEnum' });

export enum CourseTimeUnit {
  HOUR = 'HOUR',
  MINUTE = 'MINUTE',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH'
}
registerEnumType(CourseTimeUnit, { name: 'CourseTimeUnit' });

export enum CourseStatusFilter {
  PUBLISHED = 'PUBLISHED',
  SUBMISSIONS = 'SUBMISSIONS',
  UPDATED = 'UPDATED',
  DRAFTS = 'DRAFTS'
}
registerEnumType(CourseStatusFilter, { name: 'CourseStatusFilter' });

export enum CourseSortEnum {
  CREATED_AT = 'createdAt',
  JOINED = '"courseDetail"."enrolledUsersCount"',
  PUBLISHED_AT = '"courseDetail"."approvedAt"',
  REQUEST_SUBMITTED_AT = '"courseDetail"."requestSubmittedAt"',
  UPDATED_AT = 'updatedAt',
  PROFIT = 'systemShare',
  REVENUE = 'lecturerShare'
}
registerEnumType(CourseSortEnum, { name: 'CourseSortEnum' });

export enum CoursesSiteSortEnum {
  CREATED_AT = 'createdAt',
  PRICE = 'priceAfterDiscount',
  DURATION = 'learningTime'
}

registerEnumType(CoursesSiteSortEnum, { name: 'CoursesSiteSortEnum' });

export const CourseFinalStatus = {
  [CourseStatusFilter.PUBLISHED]: [CourseStatusEnum.APPROVED],
  [CourseStatusFilter.SUBMISSIONS]: [
    CourseStatusEnum.REJECTED,
    CourseStatusEnum.PENDING
  ],
  // [CourseStatusFilter.UPDATED]: [CourseStatusEnum.UPDATED],
  [CourseStatusFilter.DRAFTS]: [CourseStatusEnum.DRAFTED]
};
export enum LessonTypeEnum {
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
  LIVE_SESSION = 'LIVE_SESSION',
  QUIZ = 'QUIZ'
}
registerEnumType(LessonTypeEnum, { name: 'LessonTypeEnum' });

export enum ResourceTypeEnum {
  ATTACHMENT = 'ATTACHMENT',
  URL = 'URL'
}
registerEnumType(ResourceTypeEnum, { name: 'ResourceTypeEnum' });

export enum ReplyRequestStatusEnum {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
registerEnumType(ReplyRequestStatusEnum, { name: 'ReplyRequestStatusEnum' });

export enum CommissionType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE'
}
registerEnumType(CommissionType, { name: 'CommissionType' });
