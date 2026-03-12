import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { YearsOfExperienceRange } from '../interfaces/lecturer.type';
import { LecturerRequest } from '../models/lecturer.request.model';

export const GqLecturerRequestResponse =
  generateGqlResponseType(LecturerRequest);
export const GqLecturerRequestsResponse = generateGqlResponseType(
  Array(LecturerRequest)
);
export const GqlYearsOfExperienceRangeResponse = generateGqlResponseType(
  Array(YearsOfExperienceRange),
  true
);
