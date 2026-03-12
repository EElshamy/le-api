import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { User } from './models/user.model';

export const GqlUserResponse = generateGqlResponseType(User);
export const GqlUsersResponse = generateGqlResponseType(Array(User));
export const GqlUsersNotPaginatedResponse = generateGqlResponseType(
  Array(User),
  true
);
