import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { Skill } from './models/skill.model';

export const GqlSkillResponse = generateGqlResponseType(Skill);
export const GqlSkillsResponse = generateGqlResponseType([Skill]);
export const GqlSkillsArrayResponse = generateGqlResponseType([Skill], true);
