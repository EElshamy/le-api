import { generateGqlResponseType } from '../_common/graphql/graphql-response.type';
import { UserSocialAccount } from './user-social-account.model';

export const GqlSocialAccountsResponse = generateGqlResponseType(Array(UserSocialAccount), true);
