export const S3ClientToken = 'S3_CLIENT';

export type InternalFileUpload = {
  fileBuffer: Buffer;
  filePath: string;
  contentType?: string;
};
