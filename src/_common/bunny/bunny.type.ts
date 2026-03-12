import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Timestamp } from '../graphql/timestamp.scalar';

export enum UploadedVideoLibrary {
  COURSE = 'COURSE',
  WORKSHOP = 'WORKSHOP',
  DIPLOMA = 'DIPLOMA'
}
registerEnumType(UploadedVideoLibrary, { name: 'UploadedVideoLibrary' });

@ObjectType()
export class CreateVideoForUploadResponse {
  @Field()
  videoId: string;

  @Field(() => Timestamp)
  expirationTime: number;

  @Field()
  authorizationSignature: string;
  @Field()
  libraryId: string;
}

@ObjectType()
export class GetViewVideoSignatureResponse {
  @Field(() => Timestamp)
  expirationTime: number;

  @Field()
  authorizationSignature: string;
}

@ObjectType()
export class BunnyVideoResponse {
  @Field(() => String)
  finalUrl: string;

  @Field(() => String)
  finalUrlForMobile: string;

  @Field(() => Boolean)
  isReady: boolean;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  thumbnailUrl?: string;

  @Field(() => [String], { nullable: true })
  availableResolutions?: string[];

  @Field(() => Number, { nullable: true })
  length?: number;

  @Field(() => Number, { nullable: true })
  views?: number;
}
