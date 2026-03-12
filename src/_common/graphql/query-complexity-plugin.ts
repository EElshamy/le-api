import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Plugin } from '@nestjs/apollo';
import { GraphQLError } from 'graphql';
import { fieldExtensionsEstimator, getComplexity } from 'graphql-query-complexity';
import { ApolloServerPlugin } from '@apollo/server';
import { CustomGraphqlErrorCodes } from './custom-error-codes';
import { paginatedComplexityEstimator } from './paginated-complexity-calcultor';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  constructor(private gqlSchemaHost: GraphQLSchemaHost) {}

  async requestDidStart() {
    const maxComplexity = 100;
    const { schema } = this.gqlSchemaHost;

    const requestStartTime = Date.now(); // تسجيل الوقت عند بداية الطلب

    return {
      async didResolveOperation({ request, document }) {

        //console.log("**********************************")
        const query = document.loc?.source.body; 
        if (request.operationName !== 'IntrospectionQuery') {
          //console.log('GraphQL Query:', query);
        }

        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [fieldExtensionsEstimator(), paginatedComplexityEstimator()],
        });

        if (complexity > maxComplexity) {
          throw new GraphQLError(
            `Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
            {
              extensions: { code: CustomGraphqlErrorCodes.QUERY_TOO_COMPLEX, http: { status: 429 } },
            },
          );
        }
        //console.log('Query Complexity:', complexity); 
      },

      async willSendResponse() {
        const requestEndTime = Date.now(); 
        const timeTaken = requestEndTime - requestStartTime;
        // console.log(`Request processed in ${timeTaken} ms`);
        // console.log("**********************************")
      },
    };
  }
}
