import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { AppConfiguration } from './app-configuration.model';

export const GqlAppConfigurationResponse =
  generateGqlResponseType(AppConfiguration);
export const GqlAppConfigurationsArrayResponse = generateGqlResponseType(
  Array(AppConfiguration),
  true
);
