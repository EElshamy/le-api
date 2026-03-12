import { Inject, Injectable } from '@nestjs/common';
import { CreateDashboardEmailInput } from './dto/create-dashboard-email.input';
import { UpdateDashboardEmailInput } from './dto/update-dashboard-email.input';
import { IRepository } from '@src/_common/database/repository.interface';
import { DashboardEmail } from './models/dashboard-email.entity';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { IMailService } from '@src/_common/mail/mail.type';
import { MailService } from '@src/_common/mail/mail.service';
import {
  DashBoardEmailsFilterInput,
  DashboardEmailSort,
  DashboardEmailTypeEnum
} from './types/dashboard-email.type';
import { User } from '@src/user/models/user.model';
import { UserRoleEnum } from '@src/user/user.enum';
import { HelperService } from '@src/_common/utils/helper.service';
import { CodePrefix } from '@src/_common/utils/helpers.enum';
import { Op, Sequelize } from 'sequelize';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { SESClient } from '@aws-sdk/client-ses';
import { ConfigService } from '@nestjs/config';
import { SesService } from '@src/_common/aws/ses/services/ses.service';
import { DigitalOceanSpacesService } from '@src/_common/digitalocean/services/spaces.service';

@Injectable()
export class DashboardEmailService {
  private readonly sesClient: SESClient;
  constructor(
    @Inject(Repositories.DashboardEmailsRepository)
    private readonly dashBoardEmailsRepo: IRepository<DashboardEmail>,
    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>,
    @Inject(MailService) private readonly mailService: IMailService,
    private readonly helperService: HelperService,
    private readonly configService: ConfigService,
    private readonly sesService: SesService,
    // private readonly s3Service: S3Service,
    private readonly digitalOceanService: DigitalOceanSpacesService
  ) {
    this.sesClient = new SESClient({
      region: this.configService.get('AWS_SES_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_SES_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SES_SECRET_ACCESS_KEY')
      }
    });
  }

  async createDashboardEmail(input: CreateDashboardEmailInput) {
    const email = await this.dashBoardEmailsRepo.createOne({
      ...input,
      timesSent: 0,
      lastSentAt: new Date(),
      code: await this.helperService.generateModelCodeWithPrefix(
        CodePrefix.EMAIL,
        this.dashBoardEmailsRepo
      )
    });
    // const newEmail: DashboardEmail = await this.sendDashboardEmail(email.id);
    return email;
  }

  async sendDashboardEmail(id: string) {
    // email exists ?
    const email = await this.emailExistOrError(id);

    // update timesSent and lastSent
    const updatedEmail: DashboardEmail =
      await this.dashBoardEmailsRepo.updateOne(
        { id },
        { timesSent: email.timesSent + 1, lastSentAt: new Date() }
      );

    // send email
    void this.processEmailSending(email);

    return updatedEmail;
  }

  private async processEmailSending(email: DashboardEmail) {
    // get the target role
    let targetRole =
      email.target === DashboardEmailTypeEnum.USERS ? UserRoleEnum.USER
      : email.target === DashboardEmailTypeEnum.LECTURERS ?
        UserRoleEnum.LECTURER
      : null;

    let num = 0;

    /**
     * The SES sending rate limit is not constant and varies from one AWS account to another.
     * so we need to get our AWS account rate limit and calculate the delay between each batch.
     * For more information, see https://docs.aws.amazon.com/ses/latest/dg/limits.html
     */
    let delay = await this.getBatchDelayInMS();

    const targets: User[] = await this.usersRepo.findAll(
      {
        isBlocked: false,
        isDeleted: false,
        email: { [Op.not]: null },
        unverifiedEmail: null,
        ...(targetRole === null ?
          { role: { [Op.not]: UserRoleEnum.ADMIN } }
        : { role: targetRole })
      },
      null,
      null,
      ['id', 'email']
    );

    for (const target of targets) {
      await this.mailService.send({
        to: target.email,
        template: 'dashboard-email',
        subject: email.title,
        templateData: {
          title: email.title,
          description: email.description
        }
      });

      num++;

      // respect SES rate limit: pause after each batch of 50
      if (num % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log('Finished sending all emails ✨');
  }

  async emailExistOrError(id: string): Promise<DashboardEmail> {
    const email: DashboardEmail = await this.dashBoardEmailsRepo.findOne({
      id
    });
    if (!email) {
      throw new BaseHttpException(ErrorCodeEnum.DASHBOARD_EMAIL_NOT_FOUND);
    }
    return email;
  }

  async updateDashboardEmail(input: UpdateDashboardEmailInput) {
    // exist ?
    const email: DashboardEmail = await this.emailExistOrError(input.id);

    const newEmail: DashboardEmail = await this.dashBoardEmailsRepo.updateOne(
      { id: input.id },
      {
        ...(input?.title && { title: input.title }),
        ...(input?.description && { description: input.description }),
        ...(input?.target && { target: input.target })
      }
    );
    return newEmail;
  }

  async deleteDashboardEmail(id: string) {
    await this.emailExistOrError(id);
    await this.dashBoardEmailsRepo.deleteAll({ id });
    return true;
  }

  async findAll(
    filter?: DashBoardEmailsFilterInput,
    sort?: DashboardEmailSort,
    paginate?: PaginatorInput
  ) {
    return await this.dashBoardEmailsRepo.findPaginated(
      {
        ...(filter?.searchKey && {
          title: { [Op.iLike]: `%${filter.searchKey}%` }
        }),
        ...(filter?.target && { target: filter.target })
      },
      [
        [
          Sequelize.col(sort?.sortBy || 'createdAt'),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginate?.page || 1,
      paginate?.limit || 15
    );
  }

  async exportDashboardEmails(id?: string): Promise<string> {
    // get all emails
    const emails: DashboardEmail[] = await this.dashBoardEmailsRepo.findAll(
      {
        ...(id && { id })
      },
      [],
      [],
      ['title', 'description', 'target', 'timesSent', 'lastSentAt', 'createdAt']
    );
    return await this.helperService.createCSVFile(emails);
  }

  async getBatchDelayInMS() {
    // get the SES rate limit, our SES limit is 14 emails per second, 50000 per day
    const SESLimits = await this.sesService.getSESLimits();
    const SESMaxRate = SESLimits.MaxSendRate;

    // the SES batch limit is 50 email per batch, so we need to wait few seconds between each batch to not exceed the SES rate limit
    // if the limit is 14 emails per second, 840 emails per min, then we need to wait 4 seconds between each batch to not exceed the 840 emails per min
    const batchSize = 50;
    const delayAfterBatch = Math.ceil(batchSize / SESMaxRate);

    return delayAfterBatch * 1000;
  }
}
