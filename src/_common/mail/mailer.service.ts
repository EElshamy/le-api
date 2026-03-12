import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readdir, readFile } from 'fs/promises';
import * as path from 'path';
import Handlebars from 'handlebars';
import { SESClient } from '@aws-sdk/client-ses';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import * as https from 'https';

import { SesService } from '../aws/ses/services/ses.service';
import { NodemailerService } from './nodemailer.service';
import { DigitalOceanSpacesService } from '../digitalocean/services/spaces.service';
import { IMailService, MailDetails, TemplatesOptions } from './mail.type';
const mjml2html = require('mjml');

@Injectable()
export class MailerService implements IMailService {
  private readonly sysMailUser: string;
  private readonly nodemailerMailUser: string;
  private readonly sesClient: SESClient;
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly sesService: SesService,
    private readonly nodeMailerService: NodemailerService,
    // private readonly s3Service: S3Service
    private readonly digitalOceanService: DigitalOceanSpacesService
  ) {
    this.sysMailUser = this.configService.get<string>('SYS_MAIL');
    this.nodemailerMailUser = this.configService.get<string>('SMTP_FROM');

    this.sesClient = new SESClient({
      region: this.configService.get<string>('AWS_SES_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_SES_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SES_SECRET_ACCESS_KEY'
        )
      },
      maxAttempts: 3,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 10000, // 10 seconds connection timeout
        socketTimeout: 120000, // 2 minutes socket timeout
        httpsAgent: new https.Agent({
          maxSockets: 100 // Set the maximum number of simultaneous connections
        })
      })
    });
  }

  public async send(input: MailDetails): Promise<void> {
    const { to, from, subject, template, templateData } = input;

    // Get header/footer images
    const headerPath = `emails/footer.png`;
    const footerPath = `emails/header.png`;
    const footerImage =
      await this.digitalOceanService.getPresignedUrlForDownload(footerPath);
    const headerImage =
      await this.digitalOceanService.getPresignedUrlForDownload(headerPath);

    const completeTemplateData = {
      ...templateData,
      headerImageUrl: footerImage,
      footerImageUrl: headerImage
    };

    const html = await this.handleTemplate(
      completeTemplateData,
      path.join(
        `${process.cwd()}/src/_common/mail/templates/${template}/body.hbs`
      )
    );

    try {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        await this.sesService.sendSimpleEmail(
          this.sesClient,
          from || this.sysMailUser,
          to,
          subject,
          { htmlBody: html }
        );
      } else {
        await this.nodeMailerService.sendSimpleEmail(
          from || this.nodemailerMailUser,
          to,
          subject,
          { htmlBody: html }
        );
      }
    } catch (error) {
      this.logger.error('Failed to send email', error);
    }
  }

  private async registerPartialsToHbs(partialSource: string): Promise<void> {
    const files = await readdir(partialSource, 'utf8');
    for (const filePath of files) {
      const partialName = path.basename(filePath, '.hbs');
      const content = await readFile(
        path.join(partialSource, filePath),
        'utf8'
      );
      Handlebars.registerPartial(partialName, content);
    }
  }

  public async handleTemplate(
    data: TemplatesOptions,
    source: string,
    partialSource: string = `${process.cwd()}/src/_common/mail/templates/partials`
  ): Promise<string> {
    await this.registerPartialsToHbs(partialSource);

    const templateFile = await readFile(source, 'utf8');
    const compiled = Handlebars.compile(templateFile);
    const output = compiled({ data });
    const { html } = mjml2html(output);
    return html;
  }
}
