import { registerEnumType } from '@nestjs/graphql';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';

export enum ReportTargetEnum {
  COURSE = 'Course',
  WORKSHOP = 'WorkShop',
  DIPLOMA = 'Diploma',
  LECTURER = 'Lecturer',
  BLOG = 'Blog',
  REVIEW = 'Review',
  COMMENT = 'Comment'
}

export type ReportTargetUnionType = Course | Diploma | Lecturer;

registerEnumType(ReportTargetEnum, {
  name: 'ReportTargetEnum'
});
