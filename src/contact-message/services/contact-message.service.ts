import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { MailService } from '@src/_common/mail/mail.service';
import { IMailService } from '@src/_common/mail/mail.type';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { UploaderService } from '@src/_common/uploader/uploader.service';
import { HelperService } from '@src/_common/utils/helper.service';
import { CodePrefix } from '@src/_common/utils/helpers.enum';
import {
  NotificationParentTypeEnum,
  NotificationTypeEnum,
  SiteNotificationsTypeEnum
} from '@src/notification/notification.enum';
import { NotificationService } from '@src/notification/notification.service';
import { ReportSortEnum } from '@src/report/enums/report-sort.enum';
import { ReporterTypeEnum } from '@src/report/enums/reporter-type.enum';
import { ReportSortInput } from '@src/report/interfaces/report-sort.input';
import { User } from '@src/user/models/user.model';
import { UserRoleEnum } from '@src/user/user.enum';
import { Queue } from 'bull';
import { Op } from 'sequelize';
import { ContactMessageFilter } from '../inputs/contact-messages-filter.input';
import { CreateContactMessageInput } from '../inputs/create-contact-message.input';
import { DeleteContactMessageInput } from '../inputs/delete-contact-message.input';
import { UpdateContactMessageInput } from '../inputs/update-contact-message.input';
import { ContactMessage } from '../models/contact-message.model';
import { NotificationType } from '@aws-sdk/client-ses';

@Injectable()
export class ContactMessageService {
  constructor(
    @Inject(Repositories.ContactMessagesRepository)
    private readonly contactMessageRepo: IRepository<ContactMessage>,
    private readonly helperService: HelperService,
    private readonly uploaderService: UploaderService,
    private readonly siteNotificationsService: NotificationService,
    @Inject(MailService) private readonly mailService: IMailService,
    @InjectQueue('pusher') private pusherQueue: Queue
  ) {}

  async createContactMessage(
    input: CreateContactMessageInput,
    currentUser?: User
  ): Promise<ContactMessage> {
    const userType = this.getSenderType(currentUser);
    const { email, fullname, phone } = this.getSenderDetails(
      input,
      currentUser
    );

    const contactMessage = await this.contactMessageRepo.createOne({
      ...input,
      userId: currentUser?.id,
      senderType: userType,
      fullname,
      email,
      phone,
      code: await this.helperService.generateModelCodeWithPrefix(
        CodePrefix.INBOX,
        this.contactMessageRepo
      )
    });

    if (input.attachments?.length) {
      await this.uploaderService.setUploadedFilesReferences(
        input.attachments,
        'ContactMessage',
        'attachments',
        contactMessage.id
      );
    }

    // send notification and emails
    try {
      await this.sendNotificationsAndEmails(contactMessage, currentUser);
    } catch (error) {
      console.log(error);
    }

    return contactMessage;
  }

  // ** Determine reporter type based on user role. ** //
  private getSenderType(user?: User): ReporterTypeEnum {
    if (!user) return ReporterTypeEnum.GUEST;
    if (user.role === UserRoleEnum.LECTURER) return ReporterTypeEnum.LECTURER;
    if (user.role === UserRoleEnum.USER) return ReporterTypeEnum.USER;
    return ReporterTypeEnum.GUEST;
  }

  // ** Extracts reporter email and fullname, ensuring required fields for guests ** //
  private getSenderDetails(input: CreateContactMessageInput, user?: User) {
    if (user)
      return {
        email: user.email,
        fullname: user.enFullName,
        phone: input.phone
      };

    if (!input.email || !input.fullname) {
      throw new BaseHttpException(
        ErrorCodeEnum.REPORT_EMAIL_AND_FULLNAME_REQUIRED
      );
    }

    return { email: input.email, fullname: input.fullname, phone: input.phone };
  }

  async resolveOrUnResolveContactMessageBoard(
    input: UpdateContactMessageInput
  ): Promise<ContactMessage> {
    const contactMessage = await this.contactMessageOrError(
      input.contactMessageId
    );
    return await this.contactMessageRepo.updateOneFromExistingModel(
      contactMessage,
      {
        resolvedAt: contactMessage.resolvedAt ? null : new Date()
      }
    );
  }

  async contactMessagesBoard(
    filter: ContactMessageFilter = {},
    sort: ReportSortInput = {
      sortBy: ReportSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = { page: 1, limit: 12 }
  ): Promise<PaginationRes<ContactMessage>> {
    return await this.contactMessageRepo.findPaginated(
      {
        ...(filter?.isResolved !== undefined && {
          resolvedAt: filter.isResolved ? { [Op.ne]: null } : null
        }),
        ...(filter?.contactReason && { contactReason: filter.contactReason }),
        ...(filter?.senderType && { senderType: filter.senderType }),
        ...(filter?.searchKey && {
          [Op.or]: {
            fullname: {
              [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
            },
            email: {
              [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
            },
            phone: {
              [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
            },
            code: {
              [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
            },
            message: {
              [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
            }
          }
        })
      },
      [[sort.sortBy, sort.sortType]],
      paginate.page,
      paginate.limit
    );
  }

  async contactMessageOrError(
    contactMessageId: string
  ): Promise<ContactMessage> {
    const contactMessage = await this.contactMessageRepo.findOne({
      id: contactMessageId
    });
    if (!contactMessage)
      throw new BaseHttpException(ErrorCodeEnum.CONTACT_MESSAGE_NOT_EXIST);
    return contactMessage;
  }

  async deleteContactMessageBoard(
    input: DeleteContactMessageInput
  ): Promise<boolean> {
    const contactMessage = await this.contactMessageOrError(
      input.contactMessageId
    );
    await this.contactMessageRepo.deleteAll({ id: contactMessage.id });
    return true;
  }

  async sendNotificationsAndEmails(contactMessage: ContactMessage, user: User) {
    //send notification
    // if (contactMessage.senderType !== ReporterTypeEnum.GUEST) {
    //   await this.siteNotificationsService.createSiteNotification(
    //     SiteNotificationsTypeEnum.CONTACT_US_TICKET_CONFIRMATION,
    //     {
    //       userId: contactMessage.userId
    //     }
    //   );
    // }
    await this.pusherQueue.add('pusher', {
      toUsers: [user],
      notificationParentId: null,
      NotificationParentType: null,
      payloadData: {
        enTitle: `Leiaqa`,
        arTitle: 'لياقة',
        enBody: `Your support ticket has been submitted. Our team will reach out soon!`,
        arBody: ` تم إرسال طلب الدعم الخاص بك. سيتواصل فريقنا معك قريبًا`,
        type: NotificationTypeEnum.NEW_CONTACT_MESSAGE,
        NotificationType: NotificationTypeEnum.NEW_CONTACT_MESSAGE
      }
    });

    //send emails
    await this.mailService.send({
      to: contactMessage.email,
      template: 'contact-us-ticket-confirm',
      subject: 'We’ve Received Your Message!',
      templateData: {
        userName: contactMessage.fullname,
        ticketNumber: contactMessage.code,
        subject: contactMessage.subject,
        url: `${process.env.WEBSITE_URL}/faq`
      }
    });
  }
}
