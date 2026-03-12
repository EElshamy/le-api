import { registerEnumType } from '@nestjs/graphql';

export enum FileModelEnum {
  PROFILE_PICTURE = 'profile-picture',
  LECTURER_CV_FILE = 'lecturer-cv-file',
  TOOL_IMAGE = 'tool-image',
  COURSE_THUMBNAIL = 'course_thumbnail',
  CATEGORY_IMAGE = 'category_image',
  INVOICE = 'invoices',
  /*********************
   *COURSE_VIDEO and COURSE_PROMO_VIDEO should be removed 
   as they will be stored on bunny stream library */
  COURSE_VIDEO = 'course_video',
  COURSE_PROMO_VIDEO = 'course-promo-video',
  //****************** */
  LESSON_RESOURCES = 'lesson_resources',
  COURSE_OUTCOMES = 'course_outcomes',
  COURSE_ARTICLES = 'course_articles',
  COMMENT_ATTACHMENT = 'comment_attachment',
  CERTIFICATE = 'certifications'
}
registerEnumType(FileModelEnum, { name: 'FileModelEnum' });

//TODO: handle public folder and see what should not be public and what should have a token
export const PublicFolders = [
  FileModelEnum.COURSE_THUMBNAIL,
  FileModelEnum.TOOL_IMAGE,
  FileModelEnum.PROFILE_PICTURE,
  FileModelEnum.COURSE_OUTCOMES,
  FileModelEnum.LECTURER_CV_FILE,
  FileModelEnum.COURSE_ARTICLES,
  FileModelEnum.COMMENT_ATTACHMENT,
  FileModelEnum.CERTIFICATE,
  FileModelEnum.CATEGORY_IMAGE,
  FileModelEnum.INVOICE,
  FileModelEnum.LESSON_RESOURCES
];

export enum StorageProviderEnum {
  S3 = 'S3',
  LOCAL = 'LOCAL',
  BUNNY = 'BUNNY'
}
