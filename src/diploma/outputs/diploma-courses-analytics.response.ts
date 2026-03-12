import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { DiplomaAnalytics } from '../types/diploma-analytics.type';

export const GqlDiplomaCourseAnalyticsPaginatedResponse = generateGqlResponseType([DiplomaAnalytics]);
