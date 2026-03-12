import { registerEnumType } from '@nestjs/graphql';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';

export enum SearchSpaceEnum {
  COURSE = 'Course',
  WORKSHOP = 'WorkShop',
  DIPLOMA = 'Diploma'
}

export type SearchSpaceUnionType = Course | Diploma;

registerEnumType(SearchSpaceEnum, {
  name: 'SearchSpaceEnum'
});
