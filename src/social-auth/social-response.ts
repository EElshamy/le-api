import { generateGqlResponseType } from '../_common/graphql/graphql-response.type';
import { SocialRegisterType } from './social-auth.type';

export const GqlSocialRegisterResponse = generateGqlResponseType(SocialRegisterType);
