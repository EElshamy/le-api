import { Module } from '@nestjs/common';
import { S3Module } from '../aws/s3/s3.module';
import { BunnyModule } from '../bunny/bunny.module';
import { FilesReferencesChecking } from './files-references-checking';
import { UploaderResolver } from './uploader.resolver';
import { UploadScalar } from './uploader.scalar';
import { UploaderService } from './uploader.service';
import { SpacesModule } from '../digitalocean/spaces.module';

@Module({
  imports: [S3Module, BunnyModule, SpacesModule],
  providers: [
    UploadScalar,
    UploaderService,
    UploaderResolver,
    FilesReferencesChecking
  ],
  exports: [UploadScalar, UploaderService]
})
export class UploaderModule {}
