import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { PurchaseItem } from '@src/cart/models/purchase-item.model';
import { Purchase } from '@src/cart/models/purchase.model';
import {
  AssignUserToLearningProgramEvent,
  PayoutWalletSuccessEvent,
  TransactionRefundedEvent
} from '@src/course/interfaces/assign-user.interface';
import { Course } from '@src/course/models/course.model';
import { DiplomaCourses } from '@src/diploma/models/diploma-course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import {
  PAYOUT_WALLET_SUCCESS_EVENT,
  TRANSACTION_FULFILLED_EVENT,
  TRANSACTION_REFUNDED_EVENT
} from '@src/payment/constants/events-tokens.constants';
import { WalletOwnerTypeEnum } from '@src/payment/enums/wallets.enums';
import { Transaction } from '@src/payment/models/transaction.model';
import { Wallet } from '@src/payment/models/wallet.model';
import { User } from '@src/user/models/user.model';
import { Queue } from 'bull';
import { Repositories } from '../database/database-repository.enum';
import { IRepository } from '../database/repository.interface';
import { IMailService, MailDetails } from './mail.type';
import { Transactional } from 'sequelize-transactional-typescript';
import { DiplomaDetail } from '@src/diploma/models/diploma-detail.model';
import { CourseDetail } from '@src/course/models/course-detail.model';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';

@Injectable()
export class MailService implements IMailService {
  constructor(
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>,
    @Inject(Repositories.CoursesRepository)
    private readonly coursesRepo: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomasRepo: IRepository<Diploma>,
    @Inject(Repositories.DiplomaCoursesRepository)
    private readonly diplomaCoursesRepo: IRepository<DiplomaCourses>,
    @Inject(Repositories.DiplomaDetailsRepository)
    private readonly diplomaDetailsRepo: IRepository<DiplomaDetail>,
    @Inject(Repositories.CourseDetailsRepository)
    private readonly courseDetailsRepo: IRepository<CourseDetail>,
    @Inject(Repositories.WalletsRepository)
    private readonly walletRepo: IRepository<Wallet>,
    @Inject(Repositories.TransactionsRepository)
    private readonly trasactionsRepo: IRepository<Transaction>,
    @InjectQueue('leiaqa-mail') private readonly mailQueue: Queue,
    private readonly configService: ConfigService
  ) {}

  public async send(input: MailDetails) {
    const NODE_ENV = this.configService.get<string>('NODE_ENV');
    if (NODE_ENV === 'test' || NODE_ENV === 'development') return;
    await this.mailQueue.add('MailJob', input, { delay: 100 });
  }

  //################################# EVENTS #################################

  // send email to lecturer when monthly payout completed
  @OnEvent(PAYOUT_WALLET_SUCCESS_EVENT, { async: true })
  @Transactional()
  async handleMonthlyPayoutCompletedEmail(event: PayoutWalletSuccessEvent) {
    const wallet = await this.walletRepo.findOne(
      { id: event.walletId },
      [],
      [],
      ['ownerId', 'ownerType']
    );
    if (wallet.ownerType === WalletOwnerTypeEnum.LECTURER) {
      const lecturer = await this.lecturerRepo.findOne(
        {
          id: wallet.ownerId
        },
        [],
        [],
        ['id', 'userId']
      );
      const lecturerUser = await this.usersRepo.findOne(
        {
          id: lecturer.userId
        },
        [],
        [],
        ['id', 'email', 'firstName']
      );

      //get the month name
      const date = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
      const monthName = formatter.format(date);

      await this.send({
        to: lecturerUser.email,
        template: 'monthly-payout-completed',
        subject: 'Your Monthly Payout Has Been Processed',
        templateData: {
          lecturerName:
            lecturerUser.firstName ?? lecturerUser.enFullName.split(' ')[0],
          month: monthName
        }
      });
    }
  }

  //send emails to the user to tell him that he was enrolled successfully in a program
  @OnEvent(TRANSACTION_FULFILLED_EVENT, { async: true })
  @Transactional()
  async handleTransactionFulfilledEmail(
    event: AssignUserToLearningProgramEvent
  ) {
    const user = await this.usersRepo.findOne(
      { id: event.userId },
      [],
      [],
      ['id', 'email', 'firstName']
    );

    const courseIds: string[] = [];
    const diplomaIds: string[] = [];

    for (const learningProgram of event.learningPrograms) {
      if (
        learningProgram.learningProgramType ===
          LearningProgramTypeEnum.COURSE ||
        learningProgram.learningProgramType === LearningProgramTypeEnum.WORKSHOP
      ) {
        courseIds.push(learningProgram.learningProgramId);
      } else if (
        learningProgram.learningProgramType === LearningProgramTypeEnum.DIPLOMA
      ) {
        diplomaIds.push(learningProgram.learningProgramId);
      }
    }

    const courses =
      courseIds.length ?
        await this.coursesRepo.findAll({ id: courseIds }, [], [])
      : [];

    const diplomas =
      diplomaIds.length ?
        await this.diplomasRepo.findAll({ id: diplomaIds }, [], [])
      : [];

    for (const course of courses) {
      await this.send({
        to: user.email,
        subject: 'Congratulations on Your Purchase!',
        template: 'purchase-confirmation',
        templateData: {
          programTitle: course.enTitle,
          userName: user.firstName ?? user.enFullName.split(' ')[0],
          // url: 'https://leiaqa.com/my-learning-programs'
          url: `${process.env.WEBSITE_URL}/my-learning-programs`
        }
      });
    }

    for (const diploma of diplomas) {
      await this.send({
        to: user.email,
        subject: 'Congratulations on Your Purchase!',
        template: 'purchase-confirmation',
        templateData: {
          programTitle: diploma.enTitle,
          userName: user.firstName ?? user.enFullName.split(' ')[0],
          // url: 'https://leiaqa.com/my-learning-programs'
          url: `${process.env.WEBSITE_URL}/my-learning-programs`
        }
      });
    }
  }

  //send email to the lecturer to tell him that the user has been refunded from his course
  @OnEvent(TRANSACTION_REFUNDED_EVENT, { async: true })
  @Transactional()
  async handleTransactionRefundedEmail(
    event: TransactionRefundedEvent
  ): Promise<void> {
    const transaction = await this.trasactionsRepo.findOne(
      {
        id: event.transactionId
      },
      [
        {
          model: Purchase,
          attributes: ['id'],
          include: [
            {
              model: PurchaseItem,
              attributes: ['type', 'learningProgramId']
            }
          ]
        }
      ]
    );
    const coursesIds: string[] = transaction.purchase.purchaseItems
      .filter(
        item =>
          item.type === LearningProgramTypeEnum.COURSE ||
          item.type === LearningProgramTypeEnum.WORKSHOP
      )
      .map(item => item.learningProgramId);
    const diplomaIds: string[] = transaction.purchase.purchaseItems
      .filter(item => item.type === LearningProgramTypeEnum.DIPLOMA)
      .map(item => item.learningProgramId);

    const diplomaCoursesIds: string[] = (
      await this.diplomaCoursesRepo.findAll({
        diplomaId: diplomaIds,
        keptForOldAssignments: false
      })
    ).map(dc => dc.courseId);

    const uniqueCoursesIds = [
      ...new Set([...coursesIds, ...diplomaCoursesIds])
    ];

    await this.sendEmailsToCoursesLecturers(uniqueCoursesIds);
  }

  async sendEmailsToCoursesLecturers(coursesIds: string[]): Promise<void> {
    const courses = await this.coursesRepo.findAll(
      {
        id: coursesIds
      },
      [
        {
          model: CourseLecturer,
          include: [
            {
              model: Lecturer,
              include: [
                {
                  model: User,
                  attributes: ['id', 'email', 'firstName', 'enFullName']
                }
              ]
            }
          ]
        }
      ],
      [],
      ['id', 'enTitle']
    );

    await Promise.allSettled(
      courses.flatMap(course =>
        course.courseLecturers.map(courseLecturer => {
          const user = courseLecturer.lecturer.user;
          return this.send({
            to: user.email,
            template: 'refund-confirmation',
            subject: 'Refund Processed for Your Course',
            templateData: {
              userName: user.firstName ?? user.enFullName.split(' ')[0],
              programTitle: course.enTitle,
              programType: course.type
            }
          });
        })
      )
    );
  }
}
