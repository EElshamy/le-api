import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { Tag } from './tag.model';

export const GqlTagResponse = generateGqlResponseType(Tag);
export const GqlTagsPaginatedResponse = generateGqlResponseType(Array(Tag));
export const GqlTagsResponse = generateGqlResponseType(Array(Tag), true);
