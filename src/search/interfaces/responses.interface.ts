import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { SearchResult } from './search-result.interface';

export const GqlSearchResultsPaginatedResponse = generateGqlResponseType([
  SearchResult
]);
export const GqlSearchResultsResponse = generateGqlResponseType(
  [SearchResult],
  true
);
