import { Inject, Injectable } from '@nestjs/common';
import { S3Service } from '@src/_common/aws/s3/s3.service';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { PdfService } from '@src/_common/pdf/pdf.service';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { PurchaseItem } from '@src/cart/models/purchase-item.model';
import { Purchase } from '@src/cart/models/purchase.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { SystemConfig } from '@src/system-configuration/models/system-config.model';
import { User } from '@src/user/models/user.model';
import { LangEnum } from '@src/user/user.enum';
import { Includeable, Op, Sequelize } from 'sequelize';
import { TransactionStatusEnum } from '../enums/transaction-status.enum';
import {
  TransactionFilterForAdminInput,
  TransactionFilterForLecturerInput,
  TransactionFilterForUserInput,
  TransactionSortInput
} from '../inputs/transaction.inputs';
import { Invoice, InvoiceItem } from '../interfaces/invoice-response';
import { Coupon } from '../models/coupons.model';
import { LearningProgramRevenueShare } from '../models/revenue-share.model';
import { Transaction } from '../models/transaction.model';
import { HelperService } from '@src/_common/utils/helper.service';
import { TransactionLog } from '../models/transaction-logs.model';
import { WalletService } from './wallet.service';
import { TransactionDetails } from '../interfaces/transaction-details.response';
import { DigitalOceanSpacesService } from '@src/_common/digitalocean/services/spaces.service';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { DiplomaDetail } from '@src/diploma/models/diploma-detail.model';
import { Category } from '@src/course-specs/category/category.model';
import { DiplomaStatusEnum } from '@src/diploma/enums/diploma-status.enum';
import { CourseDetail } from '@src/course/models/course-detail.model';
import { CourseStatusEnum } from '@src/course/enums/course.enum';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';

@Injectable()
export class TransactionService {
  private vatPercentage: number;
  constructor(
    // private readonly s3Service: S3Service,
    private readonly digitalOceanService: DigitalOceanSpacesService,
    @Inject(Repositories.TransactionsRepository)
    private readonly transactionRepository: IRepository<Transaction>,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepository: IRepository<Lecturer>,
    @Inject(Repositories.PurchaseItemsRepository)
    private readonly purchaseItemRepository: IRepository<PurchaseItem>,
    @Inject(Repositories.SystemConfigRepository)
    private readonly systemConfigsRepository: IRepository<SystemConfig>,
    @Inject(Repositories.TransactionLogsRepository)
    private readonly transactionLogsRepository: IRepository<TransactionLog>,
    @Inject(Repositories.CourseLecturersRepository)
    private readonly courseLecturersRepository: IRepository<CourseLecturer>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepository: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomaRepository: IRepository<Diploma>,
    private readonly walletService: WalletService,
    private readonly pdfService: PdfService,
    private readonly helperService: HelperService
  ) {}

  async onModuleInit(): Promise<void> {
    this.vatPercentage =
      (await this.systemConfigsRepository.findOne({}))?.vat ?? 14;
  }

  // async getTransactions(
  //   filter: TransactionFilterForAdminInput,
  //   sort: TransactionSortInput,
  //   paginate: PaginatorInput
  // ): Promise<PaginationRes<Transaction>> {
  //   const whereCondition =
  //     filter?.searchKey ?
  //       {
  //         [Op.or]: [
  //           { code: { [Op.iLike]: `%${filter?.searchKey}%` } },
  //           { arTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
  //           { enTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
  //           { '$user.arFullName$': { [Op.iLike]: `%${filter?.searchKey}%` } },
  //           { '$user.enFullName$': { [Op.iLike]: `%${filter?.searchKey}%` } },
  //           { '$user.code$': { [Op.iLike]: `%${filter?.searchKey}%` } },
  //           {
  //             '$revenueShares.lecturer.user.arFullName$': {
  //               [Op.iLike]: `%${filter?.searchKey}%`
  //             }
  //           },
  //           {
  //             '$revenueShares.lecturer.user.enFullName$': {
  //               [Op.iLike]: `%${filter?.searchKey}%`
  //             }
  //           },
  //           {
  //             '$revenueShares.lecturer.user.code$': {
  //               [Op.iLike]: `%${filter?.searchKey}%`
  //             }
  //           }
  //         ]
  //       }
  //     : {};
  //   const joins: Includeable[] = [
  //     {
  //       model: User,
  //       as: 'user'
  //     },
  //     {
  //       model: LearningProgramRevenueShare,
  //       as: 'revenueShares',
  //       include: [
  //         {
  //           model: Lecturer,
  //           as: 'lecturer',
  //           include: [
  //             {
  //               model: User,
  //               as: 'user'
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   ];

  //   if (filter?.lecturerId) {
  //     joins.push({
  //       model: LearningProgramRevenueShare,
  //       where: {
  //         lecturerId: filter?.lecturerId
  //       }
  //     });
  //   }

  //   const transactions = await this.transactionRepository.findAll(
  //     {
  //       ...whereCondition,
  //       ...(filter?.userId && {
  //         userId: filter?.userId
  //       }),
  //       ...(filter?.status ?
  //         { status: filter?.status }
  //       : {
  //           status: {
  //             [Op.or]: [
  //               TransactionStatusEnum.SUCCESS,
  //               TransactionStatusEnum.REFUNDED
  //             ]
  //           }
  //         }),
  //       ...(filter?.type && { type: filter?.type }),
  //       ...(filter?.totalAmountFilter && {
  //         totalAmount: {
  //           [Op.gte]: filter?.totalAmountFilter?.from ?? 0,
  //           ...(filter?.totalAmountFilter?.to ?
  //             { [Op.lte]: filter?.totalAmountFilter?.to }
  //           : {})
  //         }
  //       }),
  //       deletedAt: { [Op.is]: null }
  //     },
  //     joins
  //     // null, //attributes
  //     // true, //nestAndRaw
  //     // false, //subQuery
  //     // null, //group
  //     // true // distinct
  //   );

  //   const uniqueTransactionsIds = this.getUniqueObjects(transactions, 'id').map(
  //     d => d.id
  //   );

  //   return await this.transactionRepository.findPaginated(
  //     {
  //       id: { [Op.in]: uniqueTransactionsIds }
  //     },
  //     [
  //       [
  //         Sequelize.col(sort?.sortBy || 'createdAt'),
  //         sort?.sortType || SortTypeEnum.DESC
  //       ]
  //     ],
  //     paginate?.page || 1,
  //     paginate?.limit || 15,
  //     [
  //       {
  //         model: User,
  //         as: 'user'
  //       }
  //     ]
  //   );
  // }

  async getTransactions(
    filter: TransactionFilterForAdminInput,
    sort: TransactionSortInput,
    pagination: PaginatorInput = {}
  ): Promise<PaginationRes<Transaction>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 15;

    //Base WHERE for Transaction
    const baseWhere: any = {
      deletedAt: { [Op.is]: null },
      ...(filter?.userId && { userId: filter.userId }),
      ...(filter?.type && { type: filter.type }),
      ...(filter?.status ?
        { status: filter.status }
      : {
          status: {
            [Op.in]: [
              TransactionStatusEnum.SUCCESS,
              TransactionStatusEnum.REFUNDED
            ]
          }
        }),
      ...(filter?.totalAmountFilter && {
        totalAmount: {
          [Op.gte]: filter.totalAmountFilter.from ?? 0,
          ...(filter.totalAmountFilter.to && {
            [Op.lte]: filter.totalAmountFilter.to
          })
        }
      })
    };

    //Includes for search
    const includes: Includeable[] = [];

    if (filter?.searchKey || filter?.lecturerId) {
      // User join
      includes.push({
        model: User,
        as: 'user',
        attributes: []
      });

      // RevenueShares join
      const revenueInclude: any = {
        model: LearningProgramRevenueShare,
        as: 'revenueShares',
        attributes: [],
        ...(filter?.lecturerId && { where: { lecturerId: filter.lecturerId } })
      };

      if (filter?.searchKey) {
        revenueInclude.include = [
          {
            model: Lecturer,
            as: 'lecturer',
            attributes: [],
            include: [{ model: User, as: 'user', attributes: [] }]
          }
        ];
      }

      includes.push(revenueInclude);
    }

    // Build search conditions
    const searchConditions: any[] = [];

    if (filter?.searchKey) {
      const search = `%${filter.searchKey}%`;

      searchConditions.push(
        { code: { [Op.iLike]: search } },
        { arTitle: { [Op.iLike]: search } },
        { enTitle: { [Op.iLike]: search } },
        { '$user.arFullName$': { [Op.iLike]: search } },
        { '$user.enFullName$': { [Op.iLike]: search } },
        { '$user.code$': { [Op.iLike]: search } },
        { '$revenueShares.lecturer.user.arFullName$': { [Op.iLike]: search } },
        { '$revenueShares.lecturer.user.enFullName$': { [Op.iLike]: search } },
        { '$revenueShares.lecturer.user.code$': { [Op.iLike]: search } }
      );
    }

    // Phase 1: Get all matching IDs
    const allMatching = await this.transactionRepository.findAll(
      {
        ...baseWhere,
        ...(searchConditions.length && { [Op.or]: searchConditions })
      },
      includes,
      [
        [
          Sequelize.col(
            sort?.sortBy ?
              `"Transaction"."${sort.sortBy}"`
            : `"Transaction"."createdAt"`
          ),
          sort?.sortType || 'DESC'
        ]
      ],
      ['id']
    );

    const allTransactionIds = allMatching.map(t => t.id);

    if (!allTransactionIds.length) {
      return {
        items: [],
        pageInfo: {
          page,
          limit,
          hasNext: false,
          hasBefore: false,
          totalPages: 0,
          totalCount: 0
        }
      };
    }

    // Phase 1 Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedIds = allTransactionIds.slice(start, end);

    // Phase 2: Fetch full data with includes
    const transactions = await this.transactionRepository.findAll(
      { id: { [Op.in]: paginatedIds } },
      includes,
      [
        [
          Sequelize.literal(
            `array_position(ARRAY[${paginatedIds
              .map(id => `'${id}'::uuid`)
              .join(',')}], "Transaction"."id")`
          ),
          'ASC'
        ]
      ]
    );

    const totalCount = allTransactionIds.length;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: transactions,
      pageInfo: {
        page,
        limit,
        hasNext: page < totalPages,
        hasBefore: page > 1,
        totalPages,
        totalCount
      }
    };
  }

  async getTransactionsForLecturer(
    filter: TransactionFilterForLecturerInput,
    sort: TransactionSortInput,
    paginate: PaginatorInput,
    user: User
  ): Promise<PaginationRes<Transaction>> {
    // get lecturerId
    const lecturerId = (
      await this.lecturerRepository.findOne({
        userId: user?.id
      })
    )?.id;
    if (!lecturerId) {
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);
    }

    //where options
    const whereOptions = {
      ...(filter?.transactionId && {
        id: filter.transactionId
      }),
      ...(filter?.searchKey && {
        [Op.or]: [{ code: { [Op.iLike]: `%${filter?.searchKey}%` } }]
      }),
      ...(filter?.type && { type: filter?.type }),
      ...(filter?.status ?
        { status: filter?.status }
      : { status: { [Op.not]: TransactionStatusEnum.PENDING } }),
      ...(filter?.totalAmountFilter && {
        totalAmount: {
          [Op.gte]: filter?.totalAmountFilter?.from ?? 0,
          [Op.lte]: filter?.totalAmountFilter?.to ?? Infinity
        }
      }),
      ...(filter?.dateRange && {
        createdAt: {
          [Op.gte]: filter?.dateRange?.from ?? 0,
          [Op.lte]: filter?.dateRange?.to ?? Infinity
        }
      }),
      deletedAt: { [Op.is]: null },
      status: { [Op.not]: TransactionStatusEnum.PENDING }
    };

    //joins
    const joins: Includeable[] = [
      {
        model: Purchase,
        as: 'purchase',
        required: true,
        include: [{ model: PurchaseItem, as: 'purchaseItems', required: true }]
      },
      {
        model: LearningProgramRevenueShare,
        as: 'revenueShares',
        required: true,
        where: {
          lecturerId
        }
      },
      {
        model: User,
        as: 'user',
        required: true,
        where: {
          [Op.or]: [
            {
              arFullName: {
                [Op.iLike]: `%${filter?.searchKeyForUser}%`
              }
            },
            {
              enFullName: {
                [Op.iLike]: `%${filter?.searchKeyForUser}%`
              }
            }
          ]
        }
      }
    ];

    // find all
    const transactions = await this.transactionRepository.findAll(
      whereOptions,
      joins
    );

    // unique transactions
    const uniqueTransactionsIds = this.getUniqueObjects(transactions, 'id').map(
      d => d.id
    );

    //find paginated
    return await this.transactionRepository.findPaginated(
      {
        id: { [Op.in]: uniqueTransactionsIds }
      },
      [
        [
          Sequelize.col(sort?.sortBy || 'createdAt'),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginate?.page || 1,
      paginate?.limit || 15,
      [
        {
          model: User,
          as: 'user'
        }
      ]
    );
  }
  async getTransactionsForUser(
    filter: TransactionFilterForUserInput,
    sort: TransactionSortInput,
    paginate: PaginatorInput,
    user: User
  ): Promise<PaginationRes<Transaction>> {
    console.log('debugging_______ getTransactionsForUser', '______');
    if (!user) {
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);
    }
    return await this.transactionRepository.findPaginated(
      {
        ...(filter?.searchKey && {
          [Op.or]: [
            { enTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
            { arTitle: { [Op.iLike]: `%${filter?.searchKey}%` } }
          ]
        }),
        userId: user.id,
        deletedAt: { [Op.is]: null },
        status: { [Op.not]: TransactionStatusEnum.PENDING }
      },
      [
        [
          Sequelize.col(sort?.sortBy || 'createdAt'),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginate?.page || 1,
      paginate?.limit || 15,
      [
        {
          model: User,
          required: true,
          as: 'user'
        },
        {
          model: Purchase,
          required: true,
          as: 'purchase'
        }
      ]
    );
  }

  async getTransactionById(transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne(
      {
        id: transactionId,
        deletedAt: { [Op.is]: null }
      },
      [
        {
          model: User,
          required: true,
          as: 'user'
        },
        {
          model: Purchase,
          required: true,
          as: 'purchase',
          include: [
            {
              model: PurchaseItem,
              required: true
            }
          ]
        },
        {
          model: LearningProgramRevenueShare,
          required: true,
          as: 'revenueShares'
        }
      ]
    );

    if (!transaction) {
      throw new BaseHttpException(ErrorCodeEnum.TRANSACTION_NOT_FOUND);
    }

    return transaction;
  }

  async getTransactionByCode(code: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne(
      {
        code,
        deletedAt: { [Op.is]: null }
      },
      [
        {
          model: User,
          required: true,
          as: 'user'
        },
        {
          model: Purchase,
          required: true,
          as: 'purchase',
          include: [
            {
              model: PurchaseItem,
              required: true
            }
          ]
        },
        {
          model: LearningProgramRevenueShare,
          required: true,
          as: 'revenueShares'
        }
      ]
    );

    if (!transaction) {
      throw new BaseHttpException(ErrorCodeEnum.TRANSACTION_NOT_FOUND);
    }

    return transaction;
  }

  //(mark it as deleted)[soft delete]
  async deleteTransaction(transactionId: string): Promise<Transaction> {
    const transaction = await this.getTransactionById(transactionId);

    return await this.transactionRepository.updateOne(
      {
        id: transaction.id
      },
      {
        deletedAt: new Date()
      }
    );
  }

  async createTransaction(
    transaction: Partial<Transaction>
  ): Promise<Transaction> {
    return await this.transactionRepository.createOne({
      ...transaction
    });
  }

  async getTransactionByRemoteCheckoutSessionId(
    remoteCheckoutSessionId: string
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne(
      {
        remoteCheckoutSessionId,
        status: TransactionStatusEnum.PENDING
      },
      [
        'user',
        'revenueShares',
        {
          model: Purchase,
          required: true,
          include: [
            {
              model: PurchaseItem,
              required: true
            }
          ]
        }
      ]
    );

    if (!transaction) {
      throw new BaseHttpException(ErrorCodeEnum.TRANSACTION_NOT_FOUND);
    }

    return transaction;
  }

  async getTransactionByRemotePaymentIntentId(
    remoteTransactionId: string
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne(
      {
        remoteTransactionId,
        status: TransactionStatusEnum.PENDING
      },
      [
        'user',
        'revenueShares',
        {
          model: Purchase,
          required: true,
          include: [
            {
              model: PurchaseItem,
              required: true
            }
          ]
        }
      ]
    );

    if (!transaction) {
      throw new BaseHttpException(ErrorCodeEnum.TRANSACTION_NOT_FOUND);
    }

    return transaction;
  }

  async getTransactionLecturerIds(transaction: Transaction): Promise<string[]> {
    const purchaseItems = await this.purchaseItemRepository.findAll({
      purchaseId: transaction.purchaseId
    });
    return purchaseItems
      .map(purchaseItems =>
        purchaseItems.productInfo.map(productInfo => productInfo.lecturerId)
      )
      .flat(1);
  }
  async getCouponTransactions(
    couponId: string,
    paginator: PaginatorInput = { page: 1, limit: 15 },
    sortType: SortTypeEnum = SortTypeEnum.DESC
  ): Promise<PaginationRes<Transaction>> {
    return await this.transactionRepository.findPaginated(
      {
        status: {
          [Op.in]: [
            TransactionStatusEnum.SUCCESS,
            TransactionStatusEnum.REFUNDED
          ]
        }
      },
      [[Sequelize.col('createdAt'), sortType ?? SortTypeEnum.DESC]],
      paginator.page,
      paginator.limit,
      [
        {
          model: Purchase,
          required: true,
          where: {
            couponId
          }
        },
        {
          model: User,
          required: true,
          as: 'user'
        },
        {
          model: Purchase,
          required: true,
          as: 'purchase'
        }
      ]
    );
  }

  // async getInvoiceByTransactionId(transactionId: string): Promise<Invoice> {
  //   const transaction = await this.transactionRepository.findOne(
  //     {
  //       id: transactionId
  //     },
  //     [
  //       {
  //         model: Purchase,
  //         required: true,
  //         include: [
  //           { model: PurchaseItem, required: true },
  //           {
  //             model: Coupon
  //           }
  //         ]
  //       },
  //       { model: User }
  //     ]
  //   );

  //   if (!transaction) {
  //     throw new BaseHttpException(ErrorCodeEnum.TRANSACTION_NOT_FOUND);
  //   }

  //   // Calculate total prices before applying coupon
  //   const totalBeforeCoupon = transaction.purchase.purchaseItems.reduce(
  //     (acc, pi) => {
  //       // Sum all finalPrice values inside productInfo array
  //       const productFinalPrices =
  //         pi.productInfo?.reduce((sum, p) => sum + (p.finalPrice ?? 0), 0) ?? 0;

  //       return acc + productFinalPrices;
  //     },
  //     0
  //   );

  //   // Distribute discount across items
  //   const invoiceItems: InvoiceItem[] = transaction.purchase.purchaseItems.map(
  //     purchaseItem => {
  //       // Calculate item total final price from productInfo
  //       const itemFinalPrice =
  //         purchaseItem.productInfo?.reduce(
  //           (sum, p) => sum + (p.finalPrice ?? 0),
  //           0
  //         ) ?? 0;

  //       const ratio =
  //         totalBeforeCoupon > 0 ? itemFinalPrice / totalBeforeCoupon : 0;

  //       // Actual amount paid for this item after distributing coupon
  //       const actualPaidForItem = Math.round(transaction.totalAmount * ratio);

  //       return {
  //         enName: purchaseItem.enTitle ?? 'NO_TITLE',
  //         arName: purchaseItem.arTitle ?? 'بلا عنوان',
  //         type: purchaseItem.type ?? LearningProgramTypeEnum.COURSE,
  //         tax:
  //           (
  //             purchaseItem.priceAfterDiscount &&
  //             purchaseItem.priceAfterDiscount > 0
  //           ) ?
  //             Math.round(
  //               (purchaseItem.priceAfterDiscount * (this.vatPercentage / 100)) /
  //                 (1 + this.vatPercentage / 100)
  //             )
  //           : 0,

  //         price:
  //           (
  //             purchaseItem.priceAfterDiscount &&
  //             purchaseItem.priceAfterDiscount > 0
  //           ) ?
  //             Math.round(
  //               purchaseItem.priceAfterDiscount -
  //                 (purchaseItem.priceAfterDiscount *
  //                   (this.vatPercentage / 100)) /
  //                   (1 + this.vatPercentage / 100)
  //             )
  //           : 0,
  //         discountCode: transaction.purchase?.coupon?.code ?? null,
  //         amountPaid: actualPaidForItem
  //       };
  //     }
  //   );

  //   // Build invoice object
  //   const invoice: Invoice = {
  //     transactionId: transaction.id,
  //     enProvidedTo: transaction.user.enFullName,
  //     arProvidedTo:
  //       transaction.user.arFullName.includes('undefined') ?
  //         transaction.user.enFullName
  //       : transaction.user.arFullName,
  //     invoiceDate: transaction.createdAt.toISOString(),
  //     couponCode: transaction.purchase.coupon?.code,
  //     invoiceNumber: this.generateInvoiceNumber(transaction.code),
  //     invoiceItems,
  //     totalAmountPaid: transaction.totalAmount
  //   };

  //   // Generate English invoice PDF if not exists
  //   if (!transaction.enInvoicePath) {
  //     this.pdfService.createInvoice({ payload: invoice, lang: LangEnum.EN });
  //     transaction.enInvoicePath = `invoices/${invoice.invoiceNumber}_en.pdf`;
  //   }

  //   // Generate Arabic invoice PDF if not exists
  //   if (!transaction.arInvoicePath) {
  //     this.pdfService.createInvoice({ payload: invoice, lang: LangEnum.AR });
  //     transaction.arInvoicePath = `invoices/${invoice.invoiceNumber}_ar.pdf`;
  //   }

  //   await transaction.save();

  //   return invoice;
  // }

  async getInvoiceByTransactionId(transactionId: string): Promise<Invoice> {
    const transaction = await this.transactionRepository.findOne(
      {
        id: transactionId
      },
      [
        {
          model: Purchase,
          required: true,
          include: [
            { model: PurchaseItem, required: true },
            {
              model: Coupon
            }
          ]
        },
        { model: User }
      ]
    );

    if (!transaction) {
      throw new BaseHttpException(ErrorCodeEnum.TRANSACTION_NOT_FOUND);
    }

    // Calculate total prices before applying coupon
    const totalBeforeCoupon = transaction.purchase.purchaseItems.reduce(
      (acc, pi) => {
        // Sum all finalPrice values inside productInfo array
        const productFinalPrices =
          pi.productInfo?.reduce((sum, p) => sum + (p.finalPrice ?? 0), 0) ?? 0;

        return acc + productFinalPrices;
      },
      0
    );

    // Distribute discount across items
    const invoiceItems: InvoiceItem[] = transaction.purchase.purchaseItems.map(
      purchaseItem => {
        // Calculate item total final price from productInfo
        const itemFinalPrice =
          purchaseItem.productInfo?.reduce(
            (sum, p) => sum + (p.finalPrice ?? 0),
            0
          ) ?? 0;

        const ratio =
          totalBeforeCoupon > 0 ? itemFinalPrice / totalBeforeCoupon : 0;

        // Actual amount paid for this item after distributing coupon
        const actualPaidForItem = Math.round(transaction.totalAmount * ratio);

        // Calculate base price
        const basePrice =
          (
            purchaseItem.priceAfterDiscount &&
            purchaseItem.priceAfterDiscount >= 0
          ) ?
            purchaseItem.priceAfterDiscount
          : (purchaseItem.originalPrice ?? 0);

        return {
          enName: purchaseItem.enTitle ?? 'NO_TITLE',
          arName: purchaseItem.arTitle ?? 'بلا عنوان',
          type: purchaseItem.type ?? LearningProgramTypeEnum.COURSE,
          tax:
            basePrice > 0 ?
              Math.round(
                (basePrice * (this.vatPercentage / 100)) /
                  (1 + this.vatPercentage / 100)
              )
            : 0,
          price:
            basePrice > 0 ?
              Math.round(
                basePrice -
                  (basePrice * (this.vatPercentage / 100)) /
                    (1 + this.vatPercentage / 100)
              )
            : 0,
          discountCode: transaction.purchase?.coupon?.code ?? null,
          amountPaid: actualPaidForItem
        };
      }
    );

    // Build invoice object
    const invoice: Invoice = {
      transactionId: transaction.id,
      enProvidedTo: transaction.user.enFullName,
      arProvidedTo:
        transaction.user.arFullName.includes('undefined') ?
          transaction.user.enFullName
        : transaction.user.arFullName,
      invoiceDate: transaction.createdAt.toISOString(),
      couponCode: transaction.purchase.coupon?.code,
      invoiceNumber: this.generateInvoiceNumber(transaction.code),
      invoiceItems,
      totalAmountPaid: transaction.totalAmount
    };

    // Generate English invoice PDF if not exists
    if (!transaction.enInvoicePath) {
      this.pdfService.createInvoice({ payload: invoice, lang: LangEnum.EN });
      transaction.enInvoicePath = `invoices/${invoice.invoiceNumber}_en.pdf`;
    }

    // Generate Arabic invoice PDF if not exists
    if (!transaction.arInvoicePath) {
      this.pdfService.createInvoice({ payload: invoice, lang: LangEnum.AR });
      transaction.arInvoicePath = `invoices/${invoice.invoiceNumber}_ar.pdf`;
    }

    await transaction.save();

    return invoice;
  }

  async generateInvoiceDownloadLink(
    transactionId: string,
    lang: LangEnum
  ): Promise<string> {
    const transaction = await this.getTransactionById(transactionId);

    return await this.digitalOceanService.getPresignedUrlForDownload(
      lang === LangEnum.EN ?
        transaction.enInvoicePath
      : transaction.arInvoicePath
    );
  }

  generateInvoiceNumber(transactionCode: string): string {
    const decimalCode = [];
    for (let i = 0; i < transactionCode.length; i++) {
      decimalCode.push(parseInt(transactionCode.charCodeAt(i).toString(), 16));
    }
    return decimalCode.join('');
  }

  async generateTransactionTitle(purchase: Purchase): Promise<{
    enTitle: string;
    arTitle: string;
  }> {
    const purchaseItems = await this.purchaseItemRepository.findAll({
      purchaseId: purchase.id
    });

    const productsEnTitlesString = purchaseItems.map(
      purchaseItem => purchaseItem.enTitle
    );

    const productArTitlesString = purchaseItems.map(
      purchaseItem => purchaseItem.arTitle
    );

    return {
      enTitle: `Purchase for ${productsEnTitlesString.join(', ')}`,
      arTitle: `شراء لـ ${productArTitlesString.join(', ')}`
    };
  }

  async exportTransactions(id?: string): Promise<string> {
    const transactions = await this.fetchTransactions(id);
    const transactionsLogs = await this.transactionLogsRepository.findAll(
      id ? { transactionId: id } : {}
    );

    return this.generateCSV(transactions, transactionsLogs, 'transactions');
  }

  async exportPayoutTransactions(): Promise<string> {
    const payoutWallets = (await this.walletService.getPayoutWallets()).items;

    const validTransactionIds = (
      await Promise.all(
        payoutWallets.map(async wallet => {
          const transaction =
            await this.walletService.getWalletTransaction(wallet);
          return transaction.id ? transaction.id : null;
        })
      )
    ).filter(Boolean);

    const transactions = await this.fetchTransactions(
      undefined,
      validTransactionIds
    );
    const transactionsLogs = await this.transactionLogsRepository.findAll({});

    return this.generateCSV(transactions, transactionsLogs, 'payouts');
  }

  private async fetchTransactions(
    id?: string,
    transactionIds?: string[]
  ): Promise<Transaction[]> {
    const whereCondition =
      id ? { id }
      : transactionIds?.length ? { id: { [Op.in]: transactionIds } }
      : {};

    return this.transactionRepository.findAll(
      whereCondition,
      [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'enFullName']
        },
        {
          model: LearningProgramRevenueShare,
          as: 'revenueShares',
          include: [
            {
              model: Lecturer,
              as: 'lecturer',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'enFullName']
                }
              ]
            }
          ]
        }
      ],
      [],
      [
        'id',
        'enTitle',
        'type',
        'totalAmount',
        'remoteTransactionId',
        'paymentDetails'
      ]
    );
  }

  private async generateCSV(
    transactions: Transaction[],
    transactionsLogs: TransactionLog[],
    type: 'transactions' | 'payouts'
  ): Promise<string> {
    if (!transactions.length) return '';

    const finalTransactions = transactions.flatMap(transaction => {
      const transactionLogs = transactionsLogs.filter(
        log => log.transactionId === transaction.id
      );

      if (!transactionLogs.length) {
        return [this.formatTransactionData(transaction)];
      }

      return transactionLogs.map(log =>
        this.formatTransactionData(transaction, log, type)
      );
    });

    const headers = this.getCSVHeaders(type);

    return this.createCSV(finalTransactions, headers);
  }

  private formatTransactionData(
    transaction: Transaction,
    log?: TransactionLog,
    type: 'transactions' | 'payouts' = 'transactions'
  ): any {
    return {
      Transaction_ID: transaction.id,
      ...(type === 'transactions' && {
        Transaction_Title: transaction.enTitle ?? ''
      }),
      ...(type === 'transactions' && {
        Transaction_Type: transaction.type ?? ''
      }),
      Amount: transaction.totalAmount / 100,
      Reference_ID: transaction.remoteTransactionId ?? '',
      ...(type === 'transactions' && {
        Payment_Method: transaction.paymentDetails?.cardBrand ?? ''
      }),
      ...(type === 'transactions' && {
        Sender_ID: transaction.user?.id ?? ''
      }),
      Sender_Name: transaction.user?.enFullName ?? '',
      Receiver_ID: transaction.revenueShares?.[0]?.lecturer?.user?.id ?? '',
      Receiver_Name:
        transaction.revenueShares?.[0]?.lecturer?.user?.enFullName ?? '',
      Action_Status: log?.status ?? '',
      Action_Change: log?.change ?? '',
      Action_Created_At:
        log ? this.helperService.formatDateTime(log.createdAt) : '',
      Action_Updated_At:
        log ? this.helperService.formatDateTime(log.updatedAt) : ''
    };
  }

  private getCSVHeaders(type: 'transactions' | 'payouts'): string[] {
    return type === 'transactions' ?
        [
          'Transaction_ID',
          'Transaction_Title',
          'Transaction_Type',
          'Amount',
          'Reference_ID',
          'Payment_Method',
          'Sender_ID',
          'Sender_Name',
          'Receiver_ID',
          'Receiver_Name',
          'Action_Status',
          'Action_Change',
          'Action_Created_At',
          'Action_Updated_At'
        ]
      : [
          'Transaction_ID',
          'Amount',
          'Reference_ID',
          'Sender_Name',
          'Receiver_ID',
          'Receiver_Name',
          'Action_Status',
          'Action_Change',
          'Action_Created_At',
          'Action_Updated_At'
        ];
  }

  private async createCSV(data: any[], headers: string[]): Promise<string> {
    const escapeCSVValue = (value: any) => {
      if (value === null || value === undefined) return '';
      const strValue = String(value);
      return (
          strValue.includes(',') ||
            strValue.includes('"') ||
            strValue.includes('\n')
        ) ?
          `"${strValue.replace(/"/g, '""')}"`
        : strValue;
    };

    const finalData = [
      headers.join(','),
      ...data.map(row => Object.values(row).map(escapeCSVValue).join(','))
    ].join('\n');

    return await this.helperService.createCSVFile(finalData, true);
  }

  getUniqueObjects(array: any[], uniqueKey: string): any[] {
    return array.filter(
      (item, index, self) =>
        index === self.findIndex(t => t[uniqueKey] === item[uniqueKey])
    );
  }

  async getTransactionDetails(id: string): Promise<TransactionDetails> {
    const transaction = await this.transactionRepository.findOne({ id }, [
      {
        model: Purchase,
        required: true,
        as: 'purchase',
        include: [
          {
            model: PurchaseItem,
            required: true
          }
        ]
      }
    ]);

    if (!transaction) {
      throw new BaseHttpException(ErrorCodeEnum.TRANSACTION_NOT_FOUND);
    }

    const vatPercentage =
      ((await this.systemConfigsRepository.findOne({}))?.vat ?? 14) / 100;
    const vatAmount =
      (transaction.totalAmount * vatPercentage) / (1 + vatPercentage) / 100;
    // console.log(
    //   'transaction',
    //   transaction.purchase.subTotalPrice, // that is the price before discount
    //   transaction.purchase.totalPrice, // that is the price after discount
    //   transaction.totalAmount // it's supposed to be  the price after discount
    // );
    // let purchaseItems=transaction.purchase.purchaseItems;
    // for(const purchaseItem of purchaseItems){
    //   purchaseItem.productInfo=purchaseItem.productInfo.map(pi=>pi.finalPrice/100)
    // }
    return {
      code: transaction.code,
      totalPrice: transaction.purchase.subTotalPrice / 100,
      netPrice: transaction.totalAmount / 100 - vatAmount,
      discountAmount:
        (transaction.purchase.subTotalPrice -
          transaction?.purchase.totalPrice) /
        100,
      totalPriceAfterDiscount: transaction.totalAmount / 100, // it's supposed to ge equal to transaction.purchase.totalPrice
      vat: Math.floor(vatPercentage * 100),
      vatAmount,
      status: transaction.status,
      paymentDetails: transaction.paymentDetails,
      purchaseItems: transaction?.purchase?.purchaseItems,
      orderDate: transaction.createdAt
    };
  }

  async getTransactionProgramsType(transactionId: string): Promise<string[]> {
    const transaction = await this.transactionRepository.findOne(
      { id: transactionId },
      [
        {
          model: Purchase,
          required: true,
          as: 'purchase',
          include: [
            {
              model: PurchaseItem,
              required: true,
              as: 'purchaseItems'
            }
          ]
        }
      ]
    );
    return transaction?.purchase?.purchaseItems?.map(
      purchaseItem => purchaseItem.type
    );
  }

  async getTransactionLecturers(transaction: Transaction): Promise<Lecturer[]> {
    const purchaseItems = await this.purchaseItemRepository.findAll({
      purchaseId: transaction.purchaseId
    });

    // console.log(
    //   'purchaseItems.productInfo',
    //   purchaseItems.map(purchaseItem => purchaseItem.productInfo)
    // );
    // console.log('purchaseItems.length', purchaseItems.length);
    // console.log('------------------------------------------');
    const coursesIds = purchaseItems.flatMap(purchaseItem => {
      return purchaseItem.productInfo.map(productInfo => productInfo.id);
    });

    // console.log('coursesIds', coursesIds);
    // console.log('coursesIds.length', coursesIds.length);
    // console.log('------------------------------------------');

    const coursesLecturers = await this.courseLecturersRepository.findAll({
      courseId: { [Op.in]: coursesIds }
    });

    // console.log('coursesLecturers', coursesLecturers);
    // console.log('coursesLecturers.length', coursesLecturers.length);
    // console.log('------------------------------------------');

    const uniqueLecturers = this.getUniqueObjects(
      coursesLecturers,
      'lecturerId'
    );

    // console.log('uniqueLecturers', uniqueLecturers);
    // console.log('uniqueLecturers.length', uniqueLecturers.length);
    // console.log('------------------------------------------');

    const lecturers = await this.lecturerRepository.findAll({
      id: {
        [Op.in]: coursesLecturers.map(
          courseLecturer => courseLecturer.lecturerId
        )
      }
    });

    return lecturers;
  }

  async getLearningProgram(
    id: string,
    type: LearningProgramTypeEnum
  ): Promise<any> {
    // console.log('getting learning program', id, type);

    if (type === LearningProgramTypeEnum.DIPLOMA) {
      const diploma = await this.diplomaRepository.findOne(
        {
          id
        },
        [
          {
            model: DiplomaDetail
          },
          {
            model: Category
          }
        ]
      );
      if (!diploma || diploma?.status !== DiplomaStatusEnum.APPROVED) {
        throw new BaseHttpException(ErrorCodeEnum.DIPLOMA_DOESNT_EXIST);
      }
      return {
        ...diploma.dataValues,
        promoVideo: diploma.diplomaDetail?.promoVideo
      };
    } else {
      const course = await this.courseRepository.findOne(
        {
          id
        },
        [
          // {
          //   model: Lecturer,
          //   required: false
          // },
          {
            model: CourseLecturer,
            include: [{ model: Lecturer }]
          },
          {
            model: CourseDetail
          },
          {
            model: Category
          }
        ]
      );
      if (!course || course?.status !== CourseStatusEnum.APPROVED) {
        throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
      }
      return {
        ...course.dataValues,
        promoVideo: course.courseDetail?.promoVideo
      };
    }
  }
}
