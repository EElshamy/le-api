import { generateGqlResponseType } from '../_common/graphql/graphql-response.type';
import { JobTitle } from './job-title.model';

export const GqlJobTitleResponse = generateGqlResponseType(JobTitle);
export const GqlJobTitlesResponse = generateGqlResponseType([JobTitle]);
