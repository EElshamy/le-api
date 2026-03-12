import { registerEnumType } from '@nestjs/graphql';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';

export enum LearningProgramTypeEnum {
  COURSE = 'Course',
  WORKSHOP = 'WorkShop',
  DIPLOMA = 'Diploma'
}
registerEnumType(LearningProgramTypeEnum, {
  name: 'RevenueShareTargetEnum'
});
export enum UpperCaseLearningProgramTypeEnum {
  COURSE = 'COURSE',
  WORKSHOP = 'WORKSHOP',
  DIPLOMA = 'DIPLOMA'
}

export type LearningProgramUnionType = Course | Diploma;

registerEnumType(UpperCaseLearningProgramTypeEnum, {
  name: 'UpperCaseLearningProgramTypeEnum'
});

export enum LearningProgramTypeForAnalyticsEnum {
  COURSE = 'Course',
  WORKSHOP = 'WorkShop',
  PATH = 'Path',
  SUBSCRIPTION = 'Subscription',
  LIVE_WORKSHOP = 'LiveWorkshop'
}
registerEnumType(LearningProgramTypeForAnalyticsEnum, {
  name: 'LearningProgramTypeForAnalyticsEnum'
});
