import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { QuizQuestion } from '../models/quiz-question.model';
// import { Quiz } from '../models/quiz.model';
import { UserQuizAttempt } from '../models/user-quiz-attempts.model';

// export const GqlQuizResponse = generateGqlResponseType(Quiz);
// export const GqlQuizzesResponse = generateGqlResponseType([Quiz]);

export const GqlUserQuizAttemptResponse = generateGqlResponseType(UserQuizAttempt);
export const GqlUserQuizAttemptsResponse = generateGqlResponseType([UserQuizAttempt]);

export const GqlQuizQuestionsResponse = generateGqlResponseType([QuizQuestion]);




