import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';

import { CourseAndDiplomas } from '@src/course/dto/courses-and-diplomas.dto';
export const GqlCousesAndDiplomasResponse = generateGqlResponseType(
  [CourseAndDiplomas],
  true
);

export const GqlCousesAndDiplomasPaginatdResponse = generateGqlResponseType(
  [CourseAndDiplomas]
);
