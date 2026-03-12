import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { Category } from './category.model';

export const GqlCategoryResponse = generateGqlResponseType(Category);
export const GqlCategoriesResponse = generateGqlResponseType([Category]);
export const GqlCategoriesArrayResponse = generateGqlResponseType([Category], true);
