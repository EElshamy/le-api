import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
// import { promises, existsSync } from 'fs';
import { Collection } from '@src/course/models/collection.model';
import { subHours } from 'date-fns';
import { Op } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { Sequelize } from 'sequelize-typescript';
import { S3Service } from '../aws/s3/s3.service';
import { BunnyService } from '../bunny/bunny-service';
import { Repositories } from '../database/database-repository.enum';
import { IRepository } from '../database/repository.interface';
import { File } from './file.model';
import { DigitalOceanSpacesService } from '../digitalocean/services/spaces.service';

@Injectable()
export class FilesReferencesChecking {
  constructor(
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    @Inject(Repositories.FilesRepository)
    private readonly fileRepo: IRepository<File>,
    // private readonly s3Service: S3Service,
    private readonly digitalOceanService: DigitalOceanSpacesService,
    private readonly bunnyService: BunnyService,
    @Inject(Repositories.CollectionsRepository)
    private readonly collectionRepo: IRepository<Collection>
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 's3FilesReferencesChecking'
  })
  async handleCronS3(): Promise<void> {
    const hasReferenceFilesIds = [];
    const files = await this.fileRepo.findAll(
      {
        hasReferenceAtDatabase: false,
        createdAt: {
          [Op.lte]: subHours(new Date(), 1)
        }
      },
      [],
      null,
      ['id', 'modelWhichUploadedFor', 'relativeDiskDestination', 'name']
    );

    console.log('files', files);

    for (const file of files) {
      const absoluteDestination = `${process.cwd()}/public/${file.relativeDiskDestination}`;
      console.log('debug');

      if (!file.modelWhichUploadedFor || !file.modelWhichUploadedFor.modelId) {
        await this.checkFileExistenceThenDeleteAndUnlinkIt(
          file,
          absoluteDestination
        );
        continue;
      }

      const model = this.sequelize.model(file.modelWhichUploadedFor.modelName);
      const dbRaw = await model.findByPk(file.modelWhichUploadedFor.modelId);

      if (!dbRaw) {
        await this.checkFileExistenceThenDeleteAndUnlinkIt(
          file,
          absoluteDestination
        );
        continue;
      }

      if (!this.hasFileReferenceAtDbModel(file, dbRaw)) {
        await this.checkFileExistenceThenDeleteAndUnlinkIt(
          file,
          absoluteDestination
        );
        continue;
      }
      hasReferenceFilesIds.push(file.id);
    }

    await this.fileRepo.updateAll(
      { id: hasReferenceFilesIds },
      { hasReferenceAtDatabase: true }
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'bunnyFilesReferencesChecking'
  })
  async handleCronBunny(): Promise<void> {
    const collectionsWithNoReferences = await this.collectionRepo.findAll(
      {
        hasReference: false
      },
      [],
      null,
      ['id', 'type']
    );
    console.log(collectionsWithNoReferences.map(collection => collection.id));
    collectionsWithNoReferences.length &&
      (await Promise.all(
        collectionsWithNoReferences.map(async collection => {
          await this.collectionRepo
            .deleteAll({ id: collection.id })
            .then(() => {
              console.log(
                'collection id',
                collection.id,
                'deleted from database'
              );
            });
          await this.bunnyService
            .deleteCollection(collection.id, collection.type)
            .then(() => {
              console.log('collection id', collection.id, 'deleted from bunny');
            });
        })
      ));
  }

  private hasFileReferenceAtDbModel(file: File, dbRaw: unknown): boolean {
    const splittingModelDestination =
      file.modelWhichUploadedFor.modelDestination.split('_');
    const fieldValue = splittingModelDestination.reduce(
      (total, fieldKey) =>
        !total ? dbRaw[fieldKey]
        : Array.isArray(total) ?
          (total as Array<string>).map(total => total[fieldKey])
        : total[fieldKey],
      ''
    );
    if (Array.isArray(fieldValue))
      return fieldValue.some((f: string) => f.includes(file.name));
    return fieldValue.includes(file.name);
  }

  private async checkFileExistenceThenDeleteAndUnlinkIt(
    file: File,
    destination: string
  ) {
    //TODO: check if file exists in storage
    // if (await this.storageService.checkIfFileExists(file.relativeDiskDestination)) {
    //   await this.storageService.deleteFile(file.relativeDiskDestination);
    // }
    const storageService = this.getStorageService(file);
    await storageService.deleteFile(file.relativeDiskDestination);
    // existsSync(destination) && (await promises.unlink(destination));
    await file.destroy();
  }

  private getStorageService(file: File) {
    return file.videoId ? this.bunnyService : this.digitalOceanService;
  }
}
