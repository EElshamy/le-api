import { generateGqlResponseType } from '../graphql/graphql-response.type';
import {
  BunnyVideoResponse,
  CreateVideoForUploadResponse,
  GetViewVideoSignatureResponse
} from './bunny.type';

export const GqlBunnyVideoResponse =
  generateGqlResponseType(BunnyVideoResponse);

export const GqlBunnyUploadCredentialsResponse = generateGqlResponseType(
  CreateVideoForUploadResponse
);
export const GqlBunnyViewCredentialsResponse = generateGqlResponseType(
  GetViewVideoSignatureResponse
);
