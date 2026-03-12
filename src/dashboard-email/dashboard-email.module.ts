import { Module } from '@nestjs/common';
import { DashboardEmailService } from './dashboard-email.service';
import { DashboardEmailResolver } from './dashboard-email.resolver';
import { HelperModule } from '@src/_common/utils/helper.module';
import { S3Module } from '@src/_common/aws/s3/s3.module';
import { SesModule } from '@src/_common/aws/ses/ses.module';
import { SpacesModule } from '@src/_common/digitalocean/spaces.module';

@Module({
  imports :[S3Module,SesModule,HelperModule , SpacesModule],
  providers: [DashboardEmailResolver, DashboardEmailService],
})
export class DashboardEmailModule {}
