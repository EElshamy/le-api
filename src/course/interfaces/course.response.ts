import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { LecturerLearningProgram } from '@src/lecturer/objectTypes/learningProgram.type';
import { Course } from '../models/course.model';
import { Section } from '../models/section.model';
import { DiplomaLearningProgram } from '@src/learning-program/interfaces/diploma-learning-programs.type';
import { CertifiedResponse, CompletedResponse } from './completed.response';

export const GqlCourseResponse = generateGqlResponseType(Course);
export const GqlCoursesResponse = generateGqlResponseType([Course]);
export const GqlDiplomaProgramsResponse = generateGqlResponseType([
  DiplomaLearningProgram
]);
export const GqlCoursesWithoutPaginationResponse = generateGqlResponseType(
  [Course],
  true
);

export const GqlSectionsResponse = generateGqlResponseType([Section]);
export const GqlSectionsWithoutPaginationResponse = generateGqlResponseType(
  [Section],
  true
);

export const GqlProgramsResponse = generateGqlResponseType([
  LecturerLearningProgram
]);

export const GqlCompletedResponse = generateGqlResponseType([
  CompletedResponse
]);

export const GqlCertifiedProgramsResponse = generateGqlResponseType([
  CertifiedResponse
]);

export const GqlNumberResponse = generateGqlResponseType(Number);
