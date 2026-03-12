import { Global, Module } from '@nestjs/common';
import { S3Module } from '../aws/s3/s3.module';
import { PdfLibService } from './packages/pdflib.service';
import { PDFProcessor } from './pdf.processor';
import { PdfService } from './pdf.service';
import { NotificationModule } from '@src/notification/notification.module';
import { DigitalOceanSpacesService } from '../digitalocean/services/spaces.service';
import { SpacesModule } from '../digitalocean/spaces.module';

@Global()
@Module({
  imports: [S3Module, NotificationModule, SpacesModule],
  providers: [PdfService, PdfLibService, PDFProcessor],
  exports: [PdfService]
})
export class PdfModule {}
