import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { PublicFolders } from '@src/_common/uploader/file.enum';
import { IStorage } from '@src/_common/uploader/storage.interface';
import { PinoLogger } from 'nestjs-pino';
import { GenerateUploadPreSignedUrlInput } from './get-signed-url.input';
import { InternalFileUpload, S3ClientToken } from './s3.type';

@Injectable()
export class S3Service implements IStorage, OnModuleInit {
  private bucketName = this.configService.get('S3_BUCKET_NAME');
  constructor(
    @Inject(S3ClientToken) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger
  ) {}

  async onModuleInit(): Promise<void> {
    // const files = await this.s3Client.send(
    //   new ListObjectsCommand({
    //     Bucket: this.bucketName
    //   })
    // );
    // dir(files, { depth: null });
  }

  async checkIfFileExists(filePath: string): Promise<boolean> {
    let file: GetObjectCommandOutput;
    try {
      file = await this.getFile(filePath);
    } catch (err) {
      console.log({ err });
      if (err.Code !== 'NoSuchKey') {
        this.logger.error(err);
        throw new BaseHttpException(ErrorCodeEnum.FETCHING_FILE_FAILED);
      }
    }
    return !!file;
  }

  async getFileAsBase64(filePath: string) {
    try {
      const file = await this.getFile(filePath);

      return {
        base64Text: await file.Body.transformToString('base64'),
        contentType: file.ContentType
      };
    } catch (err) {
      console.log(err.message);
      return { base64Text: null, contentType: null };
    }
  }

  async uploadFile(input: InternalFileUpload) {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `${input.filePath}`,
        ACL: 'authenticated-read',
        Body: input.fileBuffer,
        ...(input.contentType && { ContentType: input.contentType })
      })
    );
  }

  async getPresignedUrlForUpload(
    input: GenerateUploadPreSignedUrlInput
  ): Promise<string> {

    console.log('ussssssign s3 💛💛💛💛💛💛💛💛💛💛💛💛')

    console.log('is puplic : ' , PublicFolders.includes(input.model))
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
    //NOTE: set the expiration time to 15 minutes edit it if needed
    //TODO: see it with business
    return await getSignedUrl(this.s3Client, command, { expiresIn: 15 * 60 });
  }

  async getPresignedUrlForDownload(filePath: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: `${filePath}`
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 60 * 60 });
  }

  async getFile(filePath: string): Promise<GetObjectCommandOutput> {
    const bucketParams: GetObjectCommandInput = {
      Bucket: this.bucketName,
      Key: `${filePath}`,
      ResponseContentEncoding: 'base64'
    };
    const response = await this.s3Client.send(
      new GetObjectCommand(bucketParams)
    );
    return response;
  }

  async deleteFile(filePath: string) {
    const res = await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: `${filePath}` })
    );
    return res.DeleteMarker;
  }
}
