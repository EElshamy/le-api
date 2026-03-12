import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NodemailerService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(NodemailerService.name);

  constructor(private readonly configService: ConfigService) {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT'),
        secure: false,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS')
        }
      });
    } catch (err) {
      this.logger.error('Failed to initialize Nodemailer transporter', err);
    }
  }

  async sendSimpleEmail(
    from: string,
    to: string | string[],
    subject: string,
    body: { htmlBody?: string; textBody?: string },
    batchSize: number = 50
  ): Promise<void> {
    if (body.htmlBody && body.textBody) {
      this.logger.warn('Both htmlBody and textBody provided, ignoring request');
      return;
    }

    if (Array.isArray(to) && to.length > batchSize) {
      const batches = this.chunkArray(to, batchSize);

      for (const batch of batches) {
        await this.sendSimpleEmail(from, batch, subject, body, batchSize);
      }
      return;
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from,
      to: '',
      bcc: to,
      subject,
      ...(body.htmlBody && { html: body.htmlBody }),
      ...(body.textBody && { text: body.textBody })
    };

    try {
      if (!this.transporter) {
        this.logger.error(
          'Transporter is not initialized, skipping email send'
        );
        return;
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to.length} recipients`);
      // console.log('Email sent successfully to: ', to);
      // this.logger.debug(info);
    } catch (error) {
      this.logger.error(`Error sending email`, error.stack || error);
    }
  }

  private chunkArray(array: string[], size: number): string[][] {
    const result: string[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
}
