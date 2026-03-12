import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  HeadObjectCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { IStorage } from '@src/_common/uploader/storage.interface';
import { GenerateUploadPreSignedUrlInput } from '@src/_common/aws/s3/get-signed-url.input';
import { InternalFileUpload } from '@src/_common/aws/s3/s3.type';
import { SpaceClientToken } from '../spaces.type';
import { PublicFolders } from '@src/_common/uploader/file.enum';
import { FileToMakePublic } from '@src/_common/uploader/upload-file.input';

@Injectable()
export class DigitalOceanSpacesService implements IStorage {
  private bucketName: string = this.configService.get(
    'DIGITALOCEAN_SPACES_BUCKET'
  );

  constructor(
    private readonly configService: ConfigService,
    @Inject(SpaceClientToken) private readonly spaceClient: S3Client
  ) {}

  async checkIfFileExists(filePath: string): Promise<boolean> {
    try {
      await this.getFile(filePath);
      return true;
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return false;
      throw new BaseHttpException(ErrorCodeEnum.FETCHING_FILE_FAILED);
    }
  }

  async getFile(filePath: string): Promise<GetObjectCommandOutput> {
    const command: GetObjectCommandInput = {
      Bucket: this.bucketName,
      Key: filePath
    };

    try {
      return await this.spaceClient.send(new GetObjectCommand(command));
    } catch (error) {
      throw new BaseHttpException(ErrorCodeEnum.FETCHING_FILE_FAILED);
    }
  }

  async getFileAsBase64(filePath: string) {
    try {
      const file = await this.getFile(filePath);
      return {
        base64Text: await file.Body.transformToString('base64'),
        contentType: file.ContentType
      };
    } catch (error) {
      throw new BaseHttpException(ErrorCodeEnum.FETCHING_FILE_FAILED);
    }
  }

  async uploadFile(input: InternalFileUpload) {
    try {
      await this.spaceClient.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: input.filePath,
          Body: input.fileBuffer,
          ...(input.contentType && { ContentType: input.contentType })
        })
      );
    } catch (error) {
      throw new BaseHttpException(ErrorCodeEnum.FETCHING_FILE_FAILED);
    }
  }

  async getPresignedUrlForUpload(
    input: GenerateUploadPreSignedUrlInput
  ): Promise<string> {
    console.log('ussssssign digital ocean 💙💙💙💙💙💙💙💙💙💙💙');
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `${input.model}/${input.fileName}`,
      ContentType: input.contentType,
      ACL:
        PublicFolders.includes(input.model) ? 'public-read' : (
          'authenticated-read'
        ),
      ContentLength: input.sizeInBytes
    });

    return await getSignedUrl(this.spaceClient, command, {
      expiresIn: 15 * 60
    });
  }

  async getPresignedUrlForDownload(filePath: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filePath
    });

    return await getSignedUrl(this.spaceClient, command, {
      expiresIn: 60 * 60
    });
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.spaceClient.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: filePath
        })
      );
    } catch (error) {
      throw new BaseHttpException(ErrorCodeEnum.FETCHING_FILE_FAILED);
    }
  }

  getFileUrl(filePath: string): string {
    return `${this.configService.get('DIGITALOCEAN_SPACES_ENDPOINT')}/${this.bucketName}/${filePath}`;
  }

  async makeFilesPublic(files: FileToMakePublic[]): Promise<boolean> {
    const tasks = files
      .filter(file => PublicFolders.includes(file.model))
      .map(async file => {
        const safeFileName = file.fileName
          .trim()
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .replace(/,/g, '') // Remove commas
          .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove all special characters except . - _

        const key = `${file.model}/${safeFileName}`;

        try {
          // ✅ Step 1: Check if the object exists
          await this.spaceClient.send(
            new HeadObjectCommand({
              Bucket: this.bucketName,
              Key: key
            })
          );

          // ✅ Step 2: If exists, set it to public
          await this.spaceClient.send(
            new PutObjectAclCommand({
              Bucket: this.bucketName,
              Key: key,
              ACL: 'public-read'
            })
          );

          console.log(`[makeFilesPublic] Made public : ${key}`);
        } catch (error) {
          console.error(`[makeFilesPublic] Failed for: ${key}`, error);
          throw new BaseHttpException(ErrorCodeEnum.FETCHING_FILE_FAILED);
        }
      });

    await Promise.all(tasks);
    return true;
  }
}
