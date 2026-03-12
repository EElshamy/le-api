import { Global, Module } from '@nestjs/common';
import { SesModule } from '../aws/ses/ses.module';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';
import { MailerService } from './mailer.service';
import { S3Service } from '../aws/s3/s3.service';
import { S3Module } from '../aws/s3/s3.module';
import { NodemailerService } from './nodemailer.service';
import { SpacesModule } from '../digitalocean/spaces.module';

@Global()
@Module({
  imports: [SesModule, S3Module , SpacesModule],
  providers: [MailService, MailerService, MailProcessor, NodemailerService],
  exports: [MailService]
})
export class MailModule {}
