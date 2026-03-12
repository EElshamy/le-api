import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { Policy } from '../models/policy.model';

export const GqlPolicyResponse = generateGqlResponseType(Policy);
export const GqlPoliciesResponse = generateGqlResponseType(Array(Policy));
export const GqlPoliciesNotPaginatedResponse = generateGqlResponseType(
  Array(Policy),
  true
);
