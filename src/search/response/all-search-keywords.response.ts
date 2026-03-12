import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { SearchKeyword } from '../entities/saerch-keyword.model';

export const GqlAllSearchKeywordsResponse = generateGqlResponseType(
  [SearchKeyword],
  true
);

export const GqlAllSearchKeywordResponse =
  generateGqlResponseType(SearchKeyword);
