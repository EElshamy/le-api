import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { Blog } from './models/blog.model';

export const GqlBlogResponse = generateGqlResponseType(Blog);
export const GqlBlogsResponse = generateGqlResponseType(Array(Blog));
