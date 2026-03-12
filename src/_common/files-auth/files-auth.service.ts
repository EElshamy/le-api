import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../user/models/user.model';
import { S3Service } from '../aws/s3/s3.service';
import { BaseHttpException } from '../exceptions/base-http-exception';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';
import { PublicFolders } from '../uploader/file.enum';
import { IStorage } from '../uploader/storage.interface';
import { DigitalOceanSpacesService } from '../digitalocean/services/spaces.service';

@Injectable()
export class FilesAuthService {
  constructor(@Inject(DigitalOceanSpacesService) private readonly storageService: IStorage) {}

  /**
   * validate if the user is eligible to view the selected file
   * if the files are public then allow any one to view it
   * otherwise check if the user is allowed to view it
   * for example: course attachments are available only to enrolled users
   */
  async getFileUrlForAuthenticatedUsers(filePath: string, currentUser: User) {
    const isPublicAccess =
      await this.validateIfFileIsForPublicViewNoAuth(filePath);
    const clearedFilePath = filePath.startsWith('/')
      ? filePath.slice(1)
      : filePath;
    if (isPublicAccess)
      return await this.storageService.getPresignedUrlForDownload(
        clearedFilePath
      );

    throw new BaseHttpException(ErrorCodeEnum.ACCESS_DENIED);
    //TODO: validate other future cases and throw error for invalid
    // return await this.storageService.getPresignedUrlForDownload(filePath);
  }

  private async validateIfFileIsForPublicViewNoAuth(filePath: string) {
    if (PublicFolders.some(item => filePath.includes(item))) return true;
    return false;
  }
}
