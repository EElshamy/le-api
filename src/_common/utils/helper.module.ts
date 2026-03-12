import { Module } from '@nestjs/common';
import { HelperService } from './helper.service';
import { S3Module } from '../aws/s3/s3.module';
import { SpacesModule } from '../digitalocean/spaces.module';

@Module({
  imports: [S3Module , SpacesModule],
  providers: [HelperService],
  exports: [HelperService]
})
export class HelperModule {}
