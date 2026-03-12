import { generateGqlResponseType } from '../graphql/graphql-response.type';
import { PlaybackInfo, VdocipherUploadCredentials } from './vdocipher.type';

export const GqlVdocipherUploadCredentialsResponse = generateGqlResponseType(
  VdocipherUploadCredentials
);

export const GqlVdocipherPlaybackInfo=generateGqlResponseType(PlaybackInfo)