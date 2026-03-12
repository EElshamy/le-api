import { Module } from '@nestjs/common';
import { UserModule } from '../../user/user.module';
import { S3Module } from '../aws/s3/s3.module';
import { BunnyModule } from '../bunny/bunny.module';
import { FilesAuthService } from './files-auth.service';
import { SpacesModule } from '../digitalocean/spaces.module';

@Module({
  imports: [BunnyModule, UserModule, S3Module , SpacesModule],
  providers: [FilesAuthService],
  exports: [FilesAuthService]
})
export class FileAuthModule {}
