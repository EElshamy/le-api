import { registerEnumType } from '@nestjs/graphql';
import { Category } from '@src/course-specs/category/category.model';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';

export enum CouponDiscountTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  AMOUNT = 'AMOUNT',
  FREE = 'FREE'
}

registerEnumType(CouponDiscountTypeEnum, {
  name: 'CouponDiscountTypeEnum'
});

export enum CouponStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED'
}
registerEnumType(CouponStatusEnum, { name: 'CouponStatusEnum' });

export enum CouponSortEnum {
  CREATED_AT = 'createdAt',
  USAGE = 'timesUsed',
  ACTIVE_DURATION = 'startDate'
}
registerEnumType(CouponSortEnum, { name: 'CouponSortEnum' });

export enum CouponApplicabilityScopeEnum {
  COURSES = 'Course',
  WORKSHOPS = 'Workshop',
  DIPLOMAS = 'Diploma',
  LECTURERS = 'Lecturer',
  CATEGORIES = 'Category',
  SPECIFIC_PROGRAMS = 'SpecificPrograms',
  GLOBAL = 'Global'
}

export type CouponApplicabilityScopeType =
  | Course
  | Diploma
  | Category
  | Lecturer;

registerEnumType(CouponApplicabilityScopeEnum, {
  name: 'CouponApplicabilityScopeEnum'
});
