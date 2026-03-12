import { ApolloServerErrorCode } from '@apollo/server/errors';
import { env } from '../utils/env';
import { CustomGraphqlErrorCodes } from './custom-error-codes';

export const formatGraphqlErrors = formattedError => {
  switch (formattedError.extensions.code) {
    case ApolloServerErrorCode.INTERNAL_SERVER_ERROR:
      if (formattedError.message.match(/jwt|token|signature/)) {
        return {
          message: 'Unauthorized',
          extensions: {
            code: CustomGraphqlErrorCodes.AUTHENTICATION_ERROR
          }
        };
      }
      if (formattedError.message.match(/column/)) {
        return {
          message: env.NODE_ENV === 'production' ? 'Something Went Wrong!' : formattedError.message,
          extensions: {
            code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR
          }
        };
      }
      break;

    case ApolloServerErrorCode.BAD_REQUEST:
      /**  this error is thrown in the following cases
       * 'apollo-require-preflight' header is not present during upload
       * playground is disbled
       * using graphql upload in general (replaced by s3)
       */
      if (
        formattedError.message.includes('apollo-require-preflight') ||
        formattedError.message.includes(
          'POST body missing, invalid Content-Type, or JSON object has no keys.'
        )
      ) {
        return {
          message: 'not allowed',
          extensions: {
            code: CustomGraphqlErrorCodes.RESOURCE_NOT_ALLOWED
          }
        };
      }
      break;

    case CustomGraphqlErrorCodes.QUERY_TOO_COMPLEX:
      return {
        message:
          env.NODE_ENV === 'production' ? 'You are asking for too much!!' : formattedError.message,
        extensions: {
          code: CustomGraphqlErrorCodes.QUERY_TOO_COMPLEX
        }
      };
  }

  return formattedError;
};
