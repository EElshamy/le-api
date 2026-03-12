import { generateGqlResponseType } from '../_common/graphql/graphql-response.type';
import { FieldOfTraining } from './field-of-training.model';

export const GqlFieldOfTrainingResponse = generateGqlResponseType(FieldOfTraining);
export const GqlFieldOfTrainingsResponse = generateGqlResponseType([FieldOfTraining]);
