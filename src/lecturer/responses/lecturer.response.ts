import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { Lecturer } from '../models/lecturer.model';

export const GqLecturerResponse = generateGqlResponseType(Lecturer);
export const GqLecturersPaginatedResponse = generateGqlResponseType(
  Array(Lecturer)
);
export const GqLecturersResponse = generateGqlResponseType(
  Array(Lecturer),
  true
);
