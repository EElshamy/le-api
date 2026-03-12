import { registerEnumType } from '@nestjs/graphql';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';

export enum PurchasableTypeEnum {
  LearningProgram = 'LearningProgram',
  DIPLOMA = 'Diploma'
}

export type PurchasableUnionType = Course | Diploma;

registerEnumType(PurchasableTypeEnum, {
  name: 'RevenueShareTargetEnum'
});

export enum TempLearningProgramTypeEnum {
  COURSE = 'Course',
  WORKSHOP = 'Workshop',
  DIPLOMA = 'Diploma'
}
registerEnumType(TempLearningProgramTypeEnum, {
  name: 'TempLearningProgramTypeEnum'
});
