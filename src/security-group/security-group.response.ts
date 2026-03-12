import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { PermissionsGroups } from './permissions.type';
import { SecurityGroup } from './security-group.model';

export const GqlSecurityGroupResponse = generateGqlResponseType(SecurityGroup);
export const GqlSecurityGroupsArrayResponse = generateGqlResponseType(
  Array(SecurityGroup),
  true
);
export const GqlSecurityGroupsPaginatedResponse = generateGqlResponseType(
  Array(SecurityGroup)
);

export const GqlPermissionsGroupsArrayResponse = generateGqlResponseType(
  Array(PermissionsGroups),
  true
);
