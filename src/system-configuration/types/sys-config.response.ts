import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { SystemConfig } from '../models/system-config.model';

export const GqlSystemConfigResponse = generateGqlResponseType(SystemConfig);
export const GqlSystemConfigsArrayResponse = generateGqlResponseType(
  Array(SystemConfig),
  true
);
export const GqlSystemConfigsResponse = generateGqlResponseType(
  Array(SystemConfig)
);
