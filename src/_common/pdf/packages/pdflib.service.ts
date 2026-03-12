import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { UpperCaseLearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Invoice } from '@src/payment/interfaces/invoice-response';
import { Transaction } from '@src/payment/models/transaction.model';
import { LangEnum } from '@src/user/user.enum';
import { readFileSync } from 'fs';
import * as path from 'path';
import puppeteer, { TargetType } from 'puppeteer';
import { invoiceTableRow } from '../utils/invoice-row.util';
import { NotificationService } from '@src/notification/notification.service';
import {
  NotificationParentTypeEnum,
  NotificationTypeEnum
} from '@src/notification/notification.enum';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { User } from '@src/user/models/user.model';
import { DigitalOceanSpacesService } from '@src/_common/digitalocean/services/spaces.service';
import { FileModelEnum } from '@src/_common/uploader/file.enum';
import { CertificationType } from '@src/certification/certifications.type';
import { promises as fs } from 'fs';

export interface CertificateInput {
  certificateData: Certificate;
  lang: CertificateLang;
}

export interface Certificate {
  fullName: string;
  lecturerName: string;
  providerName: string;
  courseTitle: string;
  courseDuration: string;
  certificateDate: string;
  certificateNumber: string;
  certificateUrl: string;
  aceApprovedCourseNumber?: string;
  aceCecsAwarded?: Number;
}

export enum CertificateLang {
  EN = 'EN',
  AR = 'AR'
}

@Injectable()
export class PdfLibService {
  constructor(
    @Inject(Repositories.TransactionsRepository)
    private readonly transactionsRepository: IRepository<Transaction>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly DiplomaRepo: IRepository<Diploma>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    private readonly digitalOceanService: DigitalOceanSpacesService,
    private readonly siteNotificationsService: NotificationService,
    @InjectQueue('pusher') private readonly pusherQueue: Queue
  ) {}

  /** --------------------------------------------------
   * Create Certificate
   * -------------------------------------------------- */
  async createCertificate(
    input: Certificate,
    lang: CertificateLang = CertificateLang.EN,
    learningProgramType: UpperCaseLearningProgramTypeEnum,
    learningProgramId: string,
    userId: string,
    userCode: string,
    certificationId: string,
    certificationType: CertificationType,
    isCertified: boolean,
    isLive: boolean
  ): Promise<void> {
    console.log('creating certifications start 💜 ', certificationType, lang);
    const { background, leiaqaLogo, signature, templatePath, otherLogo } =
      await this.getCertificateAssets(
        lang,
        learningProgramType,
        certificationType,
        isCertified,
        isLive
      );

    // console.log(
    //   ' background: ',
    //   background,
    //   ' leiaqaLogo: ',
    //   leiaqaLogo,
    //   ' signature: ',
    //   signature,
    //   ' templatePath: ',
    //   templatePath,
    //   ' otherLogo: ',
    //   otherLogo
    // );

    let aceCecsAwarded: any = null;
    if (input.aceCecsAwarded !== undefined && input.aceCecsAwarded !== null) {
      aceCecsAwarded = await this.formatAceCecsAwarded(input.aceCecsAwarded);
    }

    // Read template
    let certificateHTML = readFileSync(templatePath, 'utf-8');
    console.log('------------ cetificationData ------------');
    console.log('fullName: ', input.fullName);
    console.log('courseTitle: ', input.courseTitle);
    console.log('certificateDate: ', input.certificateDate);
    console.log('certificateNumber: ', input.certificateNumber);
    console.log('lecturerName: ', input.lecturerName);
    console.log('providerName: ', input.providerName);
    console.log('aceApprovedCourseNumber: ', input.aceApprovedCourseNumber);
    console.log('aceCecsAwarded: ', aceCecsAwarded);
    console.log('userCode: ', userCode);
    console.log('------------------------------------------');

    certificateHTML = certificateHTML
      .replace('{fullName}', input.fullName)
      .replace('{courseTitle}', input.courseTitle)
      .replace('{certificateDate}', input.certificateDate)
      .replace('{certificateNumber}', input.certificateNumber) //
      .replace('{presenterName}', input.lecturerName)
      .replace('{providerName}', input.providerName)
      .replace('{aceApprovedCourseNumber}', input.aceApprovedCourseNumber)
      .replace(
        '{aceCecsAwarded}',
        aceCecsAwarded ? aceCecsAwarded.toString() : null
      )
      .replace('{userCode}', userCode) //

      .replace('{background}', background)
      .replace('{signature}', signature)
      .replace('{leiaqaLogo}', leiaqaLogo)
      .replace('{otherLogo}', otherLogo)
      .replace(
        '{learningProgramType}',
        lang === CertificateLang.EN ?
          learningProgramType === UpperCaseLearningProgramTypeEnum.COURSE ?
            'course'
          : 'program'
        : learningProgramType === UpperCaseLearningProgramTypeEnum.COURSE ?
          'الدورة'
        : 'البرنامج'
      );

    // Generate PDF & Image
    // const browser = await puppeteer.launch({
    //   headless: true,
    //   args: ['--no-sandbox', '--disable-setuid-sandbox']
    // });
    const browser = await puppeteer.launch({
      executablePath:
        '/home/baianat/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    const page = await browser.newPage();
    await page.setContent(certificateHTML, { waitUntil: 'networkidle0' });
    if (certificationType === CertificationType.ACE) {
      await page.setViewport({ width: 1400, height: 1080 });
    } else {
      await page.setViewport({ width: 1400, height: 1000 });
    }

    await page.emulateMediaType('screen');

    const pdfBuffer = Buffer.from(
      await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        pageRanges: '1'
      })
    );

    const previewImage = Buffer.from(await page.screenshot({ fullPage: true }));
    await browser.close();

    // File names include certification type
    const pdfFileName = `${input.certificateNumber}_${certificationType.toLowerCase()}_${lang.toLowerCase()}.pdf`;
    const previewFileName = `${input.certificateNumber}_${certificationType.toLowerCase()}_${lang.toLowerCase()}_preview.png`;

    //save files locally
    // const localDir = path.join(process.cwd(), 'public', 'certificates');
    // await fs.mkdir(localDir, { recursive: true });
    // await fs.writeFile(path.join(localDir, pdfFileName), pdfBuffer);
    // await fs.writeFile(path.join(localDir, previewFileName), previewImage);

    // Upload to DigitalOcean
    await this.digitalOceanService.uploadFile({
      filePath: `certifications/${pdfFileName}`,
      fileBuffer: pdfBuffer,
      contentType: 'application/pdf'
    });

    await this.digitalOceanService.uploadFile({
      filePath: `certifications/${previewFileName}`,
      fileBuffer: previewImage,
      contentType: 'image/png'
    });

    await this.digitalOceanService.makeFilesPublic([
      {
        fileName: pdfFileName,
        model: FileModelEnum.CERTIFICATE
      },
      {
        fileName: previewFileName,
        model: FileModelEnum.CERTIFICATE
      }
    ]);

    // Send notification
    await this.sendCertificateSiteNotifications(
      lang,
      learningProgramType,
      learningProgramId,
      userId,
      certificationId,
      certificationType
    );

    // console.log('files uploaded successfully 💛💛💛💛💛' , certificationType , lang);
  }

  /** --------------------------------------------------
   * Get assets & template for certificate
   * -------------------------------------------------- */
  private async getCertificateAssets(
    lang: CertificateLang,
    learningProgramType: UpperCaseLearningProgramTypeEnum,
    certificationType: CertificationType,
    isCertified: boolean,
    isLive: boolean
  ): Promise<{
    background: string;
    leiaqaLogo: string;
    signature: string;
    templatePath: string;
    otherLogo?: string;
  }> {
    const arLeiaqaLogoPath = `assets/certifications/ar-logo.png`;
    const enLeiaqaLogoPath = `assets/certifications/en-logo.png`;
    const signaturePath = `assets/certifications/signature.png`;

    const arLeiaqaLogo =
      await this.digitalOceanService.getPresignedUrlForDownload(
        arLeiaqaLogoPath
      );
    const enLeiaqaLogo =
      await this.digitalOceanService.getPresignedUrlForDownload(
        enLeiaqaLogoPath
      );
    const signature =
      await this.digitalOceanService.getPresignedUrlForDownload(signaturePath);

    let background: string;
    let templatePath: string;
    let otherLogo: string;

    switch (certificationType) {
      case CertificationType.ACE: {
        const ACE_logo =
          await this.digitalOceanService.getPresignedUrlForDownload(
            `assets/certifications/ACE-logo.png`
          );
        const ACE_background =
          await this.digitalOceanService.getPresignedUrlForDownload(
            `assets/certifications/ACE-background.png`
          );

        background = ACE_background;
        templatePath = path.join('assets/templates/ace-certificate.html');
        return {
          background,
          otherLogo: ACE_logo,
          signature,
          templatePath,
          leiaqaLogo: lang === CertificateLang.EN ? enLeiaqaLogo : arLeiaqaLogo
        };
      }

      case CertificationType.NASM: {
        const NASM_logo =
          await this.digitalOceanService.getPresignedUrlForDownload(
            `assets/certifications/NASM-logo.png`
          );
        const NASM_background =
          await this.digitalOceanService.getPresignedUrlForDownload(
            `assets/certifications/NASM-background.png`
          );
        background = NASM_background;
        templatePath = path.join('assets/templates/nasm-certificate.html');
        return {
          background,
          otherLogo: NASM_logo,
          signature,
          templatePath,
          leiaqaLogo: lang === CertificateLang.EN ? enLeiaqaLogo : arLeiaqaLogo
        };
      }

      case CertificationType.LDISAUDI: {
        const LDIS_logo =
          await this.digitalOceanService.getPresignedUrlForDownload(
            `assets/certifications/LDISAUDI-logo.png`
          );
        const LDIS_background =
          await this.digitalOceanService.getPresignedUrlForDownload(
            `assets/certifications/LDISAUDI-background.png`
          );
        background = LDIS_background;
        templatePath = path.join('assets/templates/ldisaudi-certificate.html');
        return {
          background,
          otherLogo: LDIS_logo,
          signature,
          templatePath,
          leiaqaLogo: lang === CertificateLang.EN ? enLeiaqaLogo : arLeiaqaLogo
        };
      }

      case CertificationType.LEIAQA:
      default: {
        if (isLive) {
          background =
            await this.digitalOceanService.getPresignedUrlForDownload(
              `assets/certifications/diploma-background.png`
            );
          templatePath = path.join(
            process.cwd(),
            lang === CertificateLang.EN ?
              'assets/templates/en-live-certificate.html'
            : 'assets/templates/ar-live-certificate.html'
          );
        } else if (
          learningProgramType === UpperCaseLearningProgramTypeEnum.COURSE ||
          learningProgramType === UpperCaseLearningProgramTypeEnum.WORKSHOP
        ) {
          if (isCertified) {
            // certified template
            templatePath = path.join(
              process.cwd(),
              lang === CertificateLang.EN ?
                `assets/templates/en-course-certified-certificate.html`
              : `assets/templates/ar-course-certified-certificate.html`
            );
            otherLogo =
              await this.digitalOceanService.getPresignedUrlForDownload(
                `assets/certifications/ACE-logo.png`
              );
          } else {
            templatePath = path.join(
              process.cwd(),
              lang === CertificateLang.EN ?
                `assets/templates/en-course-certificate.html`
              : `assets/templates/ar-course-certificate.html`
            );
          }

          background =
            await this.digitalOceanService.getPresignedUrlForDownload(
              `assets/certifications/course_background.png`
            );
        } else if (
          learningProgramType === UpperCaseLearningProgramTypeEnum.DIPLOMA
        ) {
          background =
            await this.digitalOceanService.getPresignedUrlForDownload(
              `assets/certifications/diploma-background.png`
            );
          templatePath = path.join(
            process.cwd(),
            lang === CertificateLang.EN ?
              'assets/templates/en-diploma-certificate.html'
            : 'assets/templates/ar-diploma-certificate.html'
          );
        }

        return {
          background,
          leiaqaLogo: lang === CertificateLang.EN ? enLeiaqaLogo : arLeiaqaLogo,
          signature,
          templatePath,
          otherLogo
        };
      }
    }
  }

  /** --------------------------------------------------
   * Send Notification when certificate created
   * -------------------------------------------------- */
  async sendCertificateSiteNotifications(
    lang: CertificateLang,
    learningProgramType: UpperCaseLearningProgramTypeEnum,
    learningProgramId: string,
    userId: string,
    certificationId: string,
    certificationType: CertificationType
  ): Promise<void> {
    const user = await this.userRepo.findOne({
      id: userId,
      isDeleted: false,
      isBlocked: false
    });

    if (!user) {
      return;
    }

    if (lang === CertificateLang.EN) {
      if (learningProgramType === UpperCaseLearningProgramTypeEnum.COURSE) {
        const course = await this.courseRepo.findOne({ id: learningProgramId });
        await this.pusherQueue.add('pusher', {
          toUsers: [user.dataValues],
          notificationParentId: certificationId,
          notificationParentType: NotificationParentTypeEnum.CERTIFICATE,
          payloadData: {
            enTitle: `leiaqa`,
            arTitle: `لياقة`,
            enBody: ` Congratulations on completing ${course.enTitle}! Your certificate is ready—download it and share your achievements with the world.`,
            arBody: `تهانينا على إكمال ${course.arTitle}! شهادتك جاهزة—قم بتنزيلها وشارك إنجازك مع العالم.`,
            url: `${process.env.WEBSITE_URL}/certification/${certificationId}`,
            type:
              certificationType === CertificationType.ACE ?
                NotificationTypeEnum.PROGRAM_COMPLETED_CERTIFICATE_AVAILABLE
              : NotificationTypeEnum.PROGRAM_COMPLETED_CERTIFICATE_AVAILABLE,
            notificationType:
              certificationType === CertificationType.ACE ?
                NotificationTypeEnum.PROGRAM_COMPLETED_CERTIFICATE_AVAILABLE
              : NotificationTypeEnum.PROGRAM_COMPLETED_CERTIFICATE_AVAILABLE,
            targetId: certificationId,
            targetType: NotificationParentTypeEnum.CERTIFICATE
          }
        });
      } else if (
        learningProgramType === UpperCaseLearningProgramTypeEnum.DIPLOMA
      ) {
        const diploma = await this.DiplomaRepo.findOne({
          id: learningProgramId
        });
        await this.pusherQueue.add('pusher', {
          toUsers: [user.dataValues],
          notificationParentId: certificationId,
          notificationParentType: NotificationParentTypeEnum.CERTIFICATE,
          payloadData: {
            enTitle: `leiaqa`,
            arTitle: `لياقة`,
            enBody: ` Congratulations on completing ${diploma.enTitle}! Your certificate is ready—download it and share your achievements with the world.`,
            arBody: `تهانينا على إكمال ${diploma.arTitle}! شهادتك جاهزة—قم بتنزيلها وشارك إنجازك مع العالم.`,
            url: `${process.env.WEBSITE_URL}/certification/${certificationId}`,
            type: NotificationTypeEnum.PROGRAM_COMPLETED_CERTIFICATE_AVAILABLE,
            notificationType:
              NotificationTypeEnum.PROGRAM_COMPLETED_CERTIFICATE_AVAILABLE,
            targetId: certificationId
          }
        });
      }
    }
  }

  /** --------------------------------------------------
   * Create Invoice
   * -------------------------------------------------- */
  async createInvoice(
    input: Invoice,
    lang: LangEnum = LangEnum.EN
  ): Promise<void> {
    let templatePath: string;

    const arLogoPath = `assets/certifications/ar-logo.png`;
    const enLogoPath = `assets/certifications/en-logo.png`;
    const arLogo =
      await this.digitalOceanService.getPresignedUrlForDownload(arLogoPath);
    const enLogo =
      await this.digitalOceanService.getPresignedUrlForDownload(enLogoPath);

    templatePath = path.join(
      process.cwd(),
      lang === LangEnum.EN ?
        'assets/templates/en-invoice.html'
      : 'assets/templates/ar-invoice.html'
    );

    let invoiceHTML = readFileSync(templatePath, 'utf-8');
    const tableRaws = input.invoiceItems
      .map(item =>
        invoiceTableRow
          .replace('{name}', lang === LangEnum.EN ? item.enName : item.arName)
          .replace(
            '{type}',
            item.type === 'Diploma' ? 'Path'
            : item.type === 'Workshop' ? 'Program'
            : item.type
          )
          .replace('{price}', (item.price / 100).toFixed(2).toString())
          .replace('{tax}', (item.tax / 100).toFixed(2).toString())
          .replace(
            '{amountPaid}',
            (item.amountPaid / 100).toFixed(2).toString()
          )
      )
      .join('');

    invoiceHTML = invoiceHTML
      .replace('{providedTo}', input.enProvidedTo)
      .replace('{invoiceDate}', input.invoiceDate)
      .replace('{invoiceNumber}', input.invoiceNumber)
      .replace('{tableRaw}', tableRaws)
      .replace(
        '{totalAmount}',
        (input.totalAmountPaid / 100).toFixed(2).toString()
      )
      .replace('{logo}', lang === LangEnum.EN ? enLogo : arLogo);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(invoiceHTML);
    await page.setViewport({ width: 1400, height: 1000 });
    await page.emulateMediaType('screen');

    const pdfBuffer = Buffer.from(
      await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        pageRanges: '1'
      })
    );
    await browser.close();

    const filePath = `invoices/${input.invoiceNumber}_${lang.toLowerCase()}.pdf`;
    await this.transactionsRepository.updateAll(
      { id: input.transactionId },
      lang === LangEnum.EN ?
        { enInvoicePath: filePath }
      : { arInvoicePath: filePath }
    );

    await this.digitalOceanService.uploadFile({
      filePath,
      fileBuffer: pdfBuffer,
      contentType: 'application/pdf'
    });
    await this.digitalOceanService.makeFilesPublic([
      {
        fileName: `${input.invoiceNumber}_${lang.toLowerCase()}.pdf`,
        model: FileModelEnum.INVOICE
      }
    ]);
  }

  async formatAceCecsAwarded(aceCecsAwarded: any): Promise<void> {
    if (Number.isInteger(aceCecsAwarded)) {
      aceCecsAwarded = `${aceCecsAwarded.toFixed(1)}`;
    } else {
      aceCecsAwarded = aceCecsAwarded.toString();
    }

    return aceCecsAwarded;
  }
}
