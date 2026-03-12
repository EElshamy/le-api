import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { Lesson } from '../models/lesson.model';
import { UserLessonVisit } from '../models/user-lesson-visit.model';

export const GqlLessonResponse = generateGqlResponseType(Lesson);
export const GqlLessonsResponse = generateGqlResponseType([Lesson]);
export const GqlLessonsWithoutPaginationResponse = generateGqlResponseType(
  [Lesson],
  true
);

export const GqlUserLessonVisitsResponse = generateGqlResponseType(
  [UserLessonVisit],
  true
);
