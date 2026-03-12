import { GenerateUploadPreSignedUrlInput } from '../aws/s3/get-signed-url.input';
import { InternalFileUpload } from '../aws/s3/s3.type';
import { FileToMakePublic } from './upload-file.input';

export interface IStorage {
  getPresignedUrlForUpload(input: GenerateUploadPreSignedUrlInput);
  getPresignedUrlForDownload(filePath: string);
  getFile(filePath: string);

  deleteFile(filePath: string);

  uploadFile(input: InternalFileUpload);

  checkIfFileExists(filePath: string): Promise<boolean>;

  getFileAsBase64(filePath: string): Promise<{
    base64Text: string;
    contentType: string;
  }>;

  makeFilesPublic?(files: FileToMakePublic[]): Promise<boolean>;
}
