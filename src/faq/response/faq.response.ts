import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { Faq } from '../models/faq.model';

export const GqlFaqResponse = generateGqlResponseType(Faq);
export const GqlFaqsResponse = generateGqlResponseType(Array(Faq));
export const GqlFaqsArrayResponse = generateGqlResponseType(Array(Faq), true);
