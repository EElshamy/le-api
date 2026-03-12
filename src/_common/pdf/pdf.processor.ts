import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { CertificateInput } from './interfaces/certificate.interfaces';
import { PdfLibService } from './packages/pdflib.service';
import { PdfTypeEnum } from './pdfType.enum';

@Processor('Pdf')
export class PDFProcessor {
  constructor(private readonly pdfLibPackage: PdfLibService) {}

  @Process(PdfTypeEnum.CERTIFICATE)
  async handleCertificate(job: Job<any>): Promise<boolean> {
    const input: CertificateInput = job.data;
    const {
      lang,
      certificateData,
      learningProgramType,
      learningProgramId,
      userId,
      userCode,
      certificationId,
      certificationType,
      isCertified,
      isLive
    } = input;

    try {
      await this.pdfLibPackage.createCertificate(
        certificateData,
        lang,
        learningProgramType,
        learningProgramId,
        userId,
        userCode,
        certificationId,
        certificationType,
        isCertified,
        isLive
      );
      return true;
    } catch (e) {
      console.error('Error processing CERTIFICATE job:', e);
      return false;
    }
  }

  @Process(PdfTypeEnum.INVOICE)
  async handleInvoice(job: Job<any>): Promise<boolean> {
    const { payload, lang } = job.data;

    try {
      await this.pdfLibPackage.createInvoice(payload, lang);
      return true;
    } catch (e) {
      console.error('Error processing INVOICE job:', e);
      return false;
    }
  }
}
