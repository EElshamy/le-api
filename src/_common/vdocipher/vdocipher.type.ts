import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';

@ObjectType()
export class VdocipherUploadCredentials {
  @Field()
  policy: string;

  @Field()
  uploadLink: string;

  @Field()
  key: string;

  @Field()
  xAmzSignature: string;

  @Field()
  xAmzAlgorithm: string;

  @Field()
  xAmzCredentials: string;

  @Field()
  xAmzDate: string;

  @Field()
  videoId: string;
}

@ObjectType()
export class PlaybackInfo {
  @Field()
  otp: string;

  @Field()
  playbackInfo: string;
}

export enum VdocipherFolderEnum {
  COURSE_VIDEO = 'classeshub-course_video',
  COURSE_PROMO_VIDEO = 'classeshub-course-promo-video'
}

registerEnumType(VdocipherFolderEnum, { name: 'VdocipherFolderEnum' });
