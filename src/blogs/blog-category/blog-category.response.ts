import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { BlogCategory } from './bLog-category.model';

export const GqlCategoryResponse = generateGqlResponseType(BlogCategory);
export const GqlCategoriesPaginatedResponse = generateGqlResponseType(Array(BlogCategory));
export const GqlCategoriesResponse = generateGqlResponseType(Array(BlogCategory) , true);
