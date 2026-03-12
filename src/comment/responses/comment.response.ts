import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { Comment } from '../models/comment.model';

export const GqlCommentResponse = generateGqlResponseType(Comment);
export const GqlCommentResponseConnection = generateGqlResponseType([Comment]);
