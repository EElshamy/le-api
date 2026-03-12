import { Inject, Injectable } from '@nestjs/common';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  promises,
  unlinkSync,
  writeFile
} from 'fs';
import { Transaction } from 'sequelize';
import { GenerateUploadPreSignedUrlInput } from '../aws/s3/get-signed-url.input';
import { S3Service } from '../aws/s3/s3.service';
import { Repositories } from '../database/database-repository.enum';
import { IRepository } from '../database/repository.interface';
import { File } from './file.model';
import { IStorage } from './storage.interface';
import { FileHandlingInput, FileToMakePublic } from './upload-file.input';
import { Upload } from './uploader.type';
import { DigitalOceanSpacesService } from '../digitalocean/services/spaces.service';
import { degrees } from 'pdf-lib';
import { v4 as uuid } from 'uuid';
@Injectable()
export class UploaderService {
  constructor(
    @Inject(Repositories.FilesRepository)
    private readonly fileRepo: IRepository<File>,
    @Inject(DigitalOceanSpacesService) private readonly storageService: IStorage
  ) {}

  async generateUploadUrl(
    input: GenerateUploadPreSignedUrlInput,
    currentUserId?: string
  ) {
    try {
      let originalName = input.fileName
        .trim()
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/,/g, '') // Remove commas
        .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove all special characters except . - _

      originalName = `${Date.now()}-${originalName}`;

      console.log('Generated Unique File Name 💜:', originalName);

      const url = await this.storageService.getPresignedUrlForUpload({
        ...input,
        fileName: originalName
      });

      await this.fileRepo.createOne({
        name: originalName,
        mimetype: input.contentType,
        uploadedById: currentUserId,
        sizeInBytes: input.sizeInBytes,
        relativeDiskDestination: `${input.model}/${originalName}`
      });

      return url;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to generate upload URL');
    }
  }

  async graphqlUpload(
    input: FileHandlingInput,
    currentUserId: string
  ): Promise<string> {
    const absoluteDiskDestination = `${process.cwd()}/public/${input.saveTo}`;

    if (typeof input.file === 'string') {
      return input.file;
    } else {
      const { filename, createReadStream, mimetype, encoding } = await (<
        Promise<Upload>
      >(<unknown>input.file));
      const name = `${Date.now()}-${filename}`;
      const relativeDiskDestination = `${input.saveTo}/${name}`;
      if (!existsSync(absoluteDiskDestination))
        mkdirSync(absoluteDiskDestination, { recursive: true });

      // Save the new file
      return new Promise((resolve, reject) => {
        createReadStream()
          .on('error', err => reject(err))
          .pipe(createWriteStream(`${absoluteDiskDestination}/${name}`))
          .on('finish', async () => {
            const fileStat = await promises.stat(
              `${absoluteDiskDestination}/${name}`
            );
            await this.fileRepo.createOne({
              relativeDiskDestination,
              name,
              sizeInBytes: fileStat.size,
              hasReferenceAtDatabase: false,
              ...(encoding && { encoding }),
              ...(mimetype && { mimetype }),
              ...(currentUserId && { uploadedById: currentUserId })
            });
            resolve(relativeDiskDestination);
          })
          .on('error', () => reject(false));
      });
    }
  }

  public getFileNameFromUrl(url: string): string {
    return url?.split('/').reverse()[0];
  }

  private deleteFile(file: string, saveTo?: string): void {
    let filePath = file;
    if (saveTo)
      filePath = `${process.cwd()}/public/${saveTo}/${this.getFileNameFromUrl(file)}`;
    if (existsSync(filePath)) unlinkSync(filePath);
  }

  private asyncWrite(path: string, data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      writeFile(path, data, err => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async setUploadedFilesReferences(
    paths: string[],
    modelName: string,
    modelDestination: string,
    modelId: string | number,
    transaction?: Transaction
  ) {
    const fileNames = paths.map(path => this.getFileNameFromUrl(path));
    if (paths.length) {
      await this.fileRepo.updateAll(
        { name: fileNames },
        {
          modelWhichUploadedFor: {
            modelName,
            modelDestination,
            modelId
          },
          hasReferenceAtDatabase: true
        },
        transaction
      );

      await this.fileRepo.deleteAll(
        /*
         * all files with {name: fileNames} should be updated by the previous query ,
         * and hasReferenceAtDatabase should be true
         * i've added this delete query to make sure that there is no file with {name: fileNames} and hasReferenceAtDatabase: false
         * because if there is any , the file would be deleted from s3 by the cron job
         */
        { name: fileNames, hasReferenceAtDatabase: false },
        transaction
      );
    }
  }

  async removeOldFilesReferences(
    newFiles: string[] = [],
    oldFiles: string[] = [],
    transaction?: Transaction
  ) {
    const unusedFiles = oldFiles.filter(file => !newFiles.includes(file));
    if (unusedFiles.length === 0) return;
    return await this.fileRepo.updateAll(
      { relativeDiskDestination: unusedFiles },
      { hasReferenceAtDatabase: false },
      transaction
    );
  }

  async generatePresignedViewUrlForViewOrDownload(
    filePath: string
  ): Promise<string> {
    return await this.storageService.getPresignedUrlForDownload(filePath);
  }

  async makeFilesPublic(files: FileToMakePublic[]): Promise<boolean> {
    return await this.storageService.makeFilesPublic(files);
  }
}
