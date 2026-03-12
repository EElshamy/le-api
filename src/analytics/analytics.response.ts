import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { FinancialAnalytics } from './types/financial-analytics.type';
import { PlatformGrowthAnalytics } from './types/platform-growth-analytics.type';
import { LearningProgramsAnalytics } from './types/learning-programs-analytics.type';
import { IntructorsAnalytics } from './types/instructors-analytics.type';
import { LearnersInsightsAnalytics } from './types/learners-insights-analytics.type';
import { SupportAndFeedbackAnalytics } from './types/support-and-feedback-analytics.type';
import { LearningProgramRevenueAnalytics } from './types/course-revenue-analytics';

export const GqlFinancialAnalyticsResponse =
  generateGqlResponseType(FinancialAnalytics);

export const GqlPlatformGrowthAnalyticsResponse =
  generateGqlResponseType(PlatformGrowthAnalytics);

  export const GqlLearningProgramsAnalyticsResponse =
  generateGqlResponseType(LearningProgramsAnalytics);

  export const GqlInstructorsAnalyticsResponse =
  generateGqlResponseType(IntructorsAnalytics);

  export const GqlLearnersInsightsAnalyticsResponse =
  generateGqlResponseType(LearnersInsightsAnalytics);

  export const GqlSupportAndFeedbackAnalyticsResponse =
  generateGqlResponseType(SupportAndFeedbackAnalytics);

  export const GqlLearningProgramRevenueAnalyticsResponse =
  generateGqlResponseType(LearningProgramRevenueAnalytics);

