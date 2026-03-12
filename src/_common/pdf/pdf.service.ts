import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Invoice } from '@src/payment/interfaces/invoice-response';
import { LangEnum } from '@src/user/user.enum';
import { Queue } from 'bull';
import { CertificateInput } from './interfaces/certificate.interfaces';
import { PdfTypeEnum } from './pdfType.enum';

@Injectable()
export class PdfService {
  constructor(@InjectQueue('Pdf') private readonly pdfQueue: Queue) {}

  public createCertificate(payload: CertificateInput): void {
    this.pdfQueue.add(PdfTypeEnum.CERTIFICATE, payload, { delay: 0 });
  }
  public createInvoice(input: { payload: Invoice; lang: LangEnum }): void {
    this.pdfQueue.add(PdfTypeEnum.INVOICE, input, { delay: 0 });
  }
}
