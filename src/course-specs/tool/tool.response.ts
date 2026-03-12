import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { Tool } from './models/tool.model';

export const GqlToolResponse = generateGqlResponseType(Tool);
export const GqlToolsResponse = generateGqlResponseType([Tool]);
export const GqlToolsArrayResponse = generateGqlResponseType([Tool], true);
