import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { AllSearchResult } from '../interfaces/all-search-result.interface';

export const GqlAllSearchResultsPaginatedResponse = generateGqlResponseType([
  AllSearchResult
]);

export const GqlAllSearchResultResponse =
  generateGqlResponseType(AllSearchResult);

export const GqlAllSearchResultsResponse = generateGqlResponseType(
  [AllSearchResult],
  true
);
