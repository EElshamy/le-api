import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { Purchase } from '@src/cart/models/purchase.model';
import { CommissionType, CourseTypeEnum } from '@src/course/enums/course.enum';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { Revenue } from '@src/payment/interfaces/user-profit.interface';
import { SystemConfig } from '@src/system-configuration/models/system-config.model';
import { Op } from 'sequelize';
import { TransactionStatusEnum } from '../enums/transaction-status.enum';
import {
  IProductInfo,
  IPurchasable
} from '../interfaces/product-line.interface';
import {
  CourseUnderDiplomaMetadata,
  TransactionLecturerRevenueForAdmin,
  TransactionPurchaseForAdmin,
  TransactionPurchaseForLecturer,
  TransactionPurchaseItemForAdmin,
  TransactionPurchaseItemForLecturer,
  TransactionRevenueForAdmin,
  TransactionRevenueForLecturer
} from '../interfaces/transaction-preview.interface';
import { LearningProgramRevenueShare } from '../models/revenue-share.model';
import { Transaction } from '../models/transaction.model';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';

@Injectable()
export class RevenueShareService implements OnModuleInit {
  private vatPercentage: number;
  private paymentGatewayVatPercentage: number;
  constructor(
    @Inject(Repositories.LecturersRepository)
    private readonly lecturersRepository: IRepository<Lecturer>,
    @Inject(Repositories.LearningProgramRevenueSharesRepository)
    private readonly revenueShareRepository: IRepository<LearningProgramRevenueShare>,
    @Inject(Repositories.PurchasesRepository)
    private readonly purchaseRepository: IRepository<Purchase>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomaRepository: IRepository<Diploma>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepository: IRepository<Course>,
    @Inject(Repositories.SystemConfigRepository)
    private readonly systemConfigsRepository: IRepository<SystemConfig>,
    @Inject(Repositories.CourseLecturersRepository)
    private readonly coureseLecturersRepository: IRepository<CourseLecturer>
  ) {}

  async onModuleInit(): Promise<void> {
    this.vatPercentage =
      ((await this.systemConfigsRepository.findOne({}))?.vat ?? 14) / 100;

    this.paymentGatewayVatPercentage =
      ((await this.systemConfigsRepository.findOne({}))?.paymentGatewayVat ??
        0) / 100;
  }

  async getUserTotalPurchaseAmount(userId: string): Promise<number> {
    const revenueShares = await this.revenueShareRepository.findAll({}, [
      {
        model: Transaction,
        where: {
          userId,
          status: TransactionStatusEnum.SUCCESS
        }
      }
    ]);
    return revenueShares.reduce(
      (total, revenueShare) => total + revenueShare.totalAmount,
      0
    );
  }

  async getUserProfitsForLearningProgram(
    userId: string,
    learningProgramId: string
  ): Promise<Revenue> {
    const revenueShares = await this.revenueShareRepository.findAll(
      {
        [Op.or]: [
          { programId: learningProgramId },
          { parentId: learningProgramId }
        ]
      },
      [
        {
          model: Transaction,
          where: { userId, status: TransactionStatusEnum.SUCCESS }
        }
      ]
    );
    return {
      lectureProfit: revenueShares.reduce(
        (total, revenueShare) => total + revenueShare.lecturerShare,
        0
      ),
      systemProfit: revenueShares.reduce(
        (total, revenueShare) => total + revenueShare.systemShare,
        0
      )
    };
  }

  async getLecturerTotalRevenue(lecturerId: string): Promise<number> {
    const revenueShares = await this.revenueShareRepository.findAll(
      {
        lecturerId
      },
      [
        {
          model: Transaction,
          required: true,
          where: {
            status: TransactionStatusEnum.SUCCESS
          }
        }
      ]
    );
    return revenueShares.reduce(
      (total, revenueShare) => total + revenueShare.lecturerShare,
      0
    );
  }

  async getCourseRevenue(programId: string): Promise<Revenue> {
    const revenueShares = await this.revenueShareRepository.findAll(
      {
        programId
      },
      [
        {
          model: Transaction,
          required: true,
          where: {
            status: TransactionStatusEnum.SUCCESS
          }
        }
      ]
    );
    return {
      lectureProfit: revenueShares.reduce(
        (total, revenueShare) => total + revenueShare.lecturerShare,
        0
      ),
      systemProfit: revenueShares.reduce(
        (total, revenueShare) => total + revenueShare.systemShare,
        0
      )
    };
  }

  async getDiplomaRevenue(parentId: string): Promise<Revenue> {
    const revenueShares = await this.revenueShareRepository.findAll(
      {
        parentId
      },
      [
        {
          model: Transaction,
          required: true,
          where: {
            status: TransactionStatusEnum.SUCCESS
          }
        }
      ]
    );
    return {
      lectureProfit: revenueShares.reduce(
        (total, revenueShare) => total + revenueShare.lecturerShare,
        0
      ),
      systemProfit: revenueShares.reduce(
        (total, revenueShare) => total + revenueShare.systemShare,
        0
      )
    };
  }

  async getTransactionPurchaseForLecturer(
    transaction: Transaction,
    userId: string
  ): Promise<TransactionPurchaseForLecturer> {
    if (!transaction) {
      console.warn(`[DEBUG] No transaction found`);
      return null;
    }

    const lecturer = await this.lecturersRepository.findOne({
      userId
    });

    if (!lecturer) {
      console.warn(`[DEBUG] No lecturer found for user: ${userId}`);
      return null;
    }

    // 1. get transaction purchase
    const purchase = await this.getTransactionPurchase(transaction);
    if (!purchase) {
      console.warn(
        `[DEBUG] No purchase found for transaction: ${transaction?.id}`
      );
      return null;
    }

    // 2. get revenue shares for that transaction
    const revenueShares = await this.getTransactionRevenueShares(
      transaction,
      lecturer.id
    );

    // 3. get transaction purchase items lecturer view
    const transactionPurchaseItems: TransactionPurchaseItemForLecturer[] = [];
    for (const revenueShare of revenueShares) {
      const courseUnderDiplomaMetadata: CourseUnderDiplomaMetadata = {
        diplomaId: '',
        arMetadata: '',
        enMetadata: ''
      };

      if (revenueShare.parentType === LearningProgramTypeEnum.DIPLOMA) {
        const diploma = await this.diplomaRepository.findOne(
          {
            id: revenueShare.parentId
          },
          null,
          null,
          ['arTitle', 'enTitle']
        );

        if (diploma) {
          courseUnderDiplomaMetadata.diplomaId = revenueShare.parentId;
          courseUnderDiplomaMetadata.arMetadata = `في ${diploma.arTitle}`;
          courseUnderDiplomaMetadata.enMetadata = `in ${diploma.enTitle}`;
        } else {
          console.warn(
            `[DEBUG] No diploma found for parentId: ${revenueShare.parentId}`
          );
        }
      }

      // ! calculating lecturer commission with this way is not correct
      const lecturerCommission = Math.round(
        (revenueShare.lecturerShare / revenueShare.totalAmount) * 100
      );

      const program = await this.courseRepository.findOne({
        id: revenueShare.programId
      });

      if (program) {
        transactionPurchaseItems.push({
          ...program.dataValues,
          learningProgramId: program.id,
          type:
            program.type === CourseTypeEnum.COURSE ?
              LearningProgramTypeEnum.COURSE
            : LearningProgramTypeEnum.WORKSHOP,
          lecturerShareOfPurchaseItem: {
            lecturerShare: revenueShare.lecturerShare,
            lecturerCommission:
              isNaN(lecturerCommission) ? 0 : lecturerCommission,
            courseUnderDiplomaMetadata
          }
        });
      } else {
        console.warn(
          `[DEBUG] No program found for programId: ${revenueShare.programId}`
        );
      }
    }

    return {
      ...purchase.dataValues,
      transactionPurchaseItemsForLecturer: transactionPurchaseItems
    };
  }

  async getTransactionPurchaseForAdmin(
    transaction: Transaction
  ): Promise<TransactionPurchaseForAdmin> {
    const purchase = await this.getTransactionPurchase(transaction);
    const revenueShares = await this.getTransactionRevenueShares(transaction);

    // console.log(
    //   'revenueShares : ',
    //   revenueShares.map(rs => rs.toJSON())
    // );
    // console.log('---------------------');

    const transactionPurchaseItems: TransactionPurchaseItemForAdmin[] =
      purchase.purchaseItems.map(item => ({
        ...item?.dataValues,
        lecturersShares: []
      }));

    const lecturerIds = [
      ...new Set(revenueShares.map(rs => rs.lecturerId).filter(Boolean))
    ];

    const lecturersList = await this.lecturersRepository.findAll(
      { id: lecturerIds },
      ['user']
    );

    const lecturersMap = new Map(
      lecturersList.map(l => [
        l.id,
        {
          lecturerId: l.id,
          lecturerArName: l.user?.arFullName ?? '',
          lecturerEnName: l.user?.enFullName ?? ''
        }
      ])
    );

    for (const revenueShare of revenueShares) {
      const lecturerData = lecturersMap.get(revenueShare.lecturerId);

      if (!lecturerData) {
        continue;
      }

      const lecturerRevenue: TransactionLecturerRevenueForAdmin = {
        lecturerId: lecturerData.lecturerId,
        lecturerArName: lecturerData.lecturerArName,
        lecturerEnName: lecturerData.lecturerEnName,
        totalLecturerShare: revenueShare.lecturerShare,
        totalSystemShare: revenueShare.systemShare
      };

      const purchaseItemIndex = transactionPurchaseItems.findIndex(item => {
        if (revenueShare.parentType === LearningProgramTypeEnum.DIPLOMA) {
          return (
            item.type === LearningProgramTypeEnum.DIPLOMA &&
            item.learningProgramId === revenueShare.parentId
          );
        }
        return item.learningProgramId === revenueShare.programId;
      });

      if (purchaseItemIndex === -1) {
        console.warn(
          `No matching purchaseItem for programId ${revenueShare.programId}`
        );
        continue;
      }

      const lecturersRevenues =
        transactionPurchaseItems[purchaseItemIndex].lecturersShares;

      const existingIndex = lecturersRevenues.findIndex(
        lr => lr.lecturerId === lecturerRevenue.lecturerId
      );

      if (existingIndex > -1) {
        lecturersRevenues[existingIndex].totalLecturerShare +=
          lecturerRevenue.totalLecturerShare;
        lecturersRevenues[existingIndex].totalSystemShare +=
          lecturerRevenue.totalSystemShare;
      } else {
        lecturersRevenues.push(lecturerRevenue);
      }
    }

    return {
      ...purchase?.dataValues,
      transactionPurchaseItems,
      totalSystemShare: revenueShares.reduce(
        (total, revenueShare) => total + revenueShare.systemShare,
        0
      ),
      totalVatAmount: revenueShares.reduce(
        (total, revenueShare) => total + revenueShare.vatAmount,
        0
      ),
      paymentGateWayVatAmount: revenueShares.reduce(
        (total, revenueShare) => total + revenueShare.paymentGateWayVatAmount,
        0
      )
    };
  }
  // async getTransactionPurchaseForAdmin(
  //   transaction: Transaction
  // ): Promise<TransactionPurchaseForAdmin> {
  //   // 1. Get transaction purchase
  //   const purchase = await this.getTransactionPurchase(transaction);

  //   // 2. Get revenue shares for that transaction
  //   const revenueShares = await this.getTransactionRevenueShares(transaction);

  //   // 3. Prepare transaction purchase items
  //   const transactionPurchaseItems: TransactionPurchaseItemForAdmin[] =
  //     purchase.purchaseItems.map(item => ({
  //       ...item?.dataValues,
  //       lecturersShares: []
  //     }));

  //   // 4. Distribute revenue shares to the correct purchase items
  //   for (const revenueShare of revenueShares) {
  //     const lecturer = await this.lecturersRepository.findOne(
  //       { id: revenueShare.lecturerId },
  //       ['user']
  //     );

  //     const lecturerRevenue: TransactionLecturerRevenueForAdmin = {
  //       lecturerArName: lecturer?.user?.arFullName ?? '',
  //       lecturerEnName: lecturer?.user?.enFullName ?? '',
  //       totalLecturerShare: revenueShare.lecturerShare,
  //       totalSystemShare: revenueShare.systemShare
  //     };

  //     // Find the matching purchase item
  //     const index = transactionPurchaseItems.findIndex(item => {
  //       if (item.type === LearningProgramTypeEnum.DIPLOMA) {
  //         return (
  //           item.learningProgramId === revenueShare.parentId &&
  //           revenueShare.parentType === LearningProgramTypeEnum.DIPLOMA
  //         );
  //       } else {
  //         return (
  //           item.learningProgramId === revenueShare.programId &&
  //           !revenueShare.parentId
  //         );
  //       }
  //     });

  //     // If matched, add or update the lecturer in the item's lecturersShares
  //     if (index > -1) {
  //       const existingList = transactionPurchaseItems[index].lecturersShares;
  //       const existingIndex = existingList.findIndex(
  //         l =>
  //           l.lecturerArName === lecturerRevenue.lecturerArName ||
  //           l.lecturerEnName === lecturerRevenue.lecturerEnName
  //       );

  //       if (existingIndex > -1) {
  //         existingList[existingIndex].totalLecturerShare +=
  //           lecturerRevenue.totalLecturerShare;
  //         existingList[existingIndex].totalSystemShare +=
  //           lecturerRevenue.totalSystemShare;
  //       } else {
  //         existingList.push(lecturerRevenue);
  //       }
  //     }
  //   }

  //   // 5. Return final result
  //   return {
  //     ...purchase?.dataValues,
  //     transactionPurchaseItems,
  //     totalSystemShare: revenueShares.reduce(
  //       (total, revenueShare) => total + revenueShare.systemShare,
  //       0
  //     ),
  //     totalVatAmount: revenueShares.reduce(
  //       (total, revenueShare) => total + revenueShare.vatAmount,
  //       0
  //     )
  //   };
  // }

  async getTransactionRevenueForLecturer(
    transaction: Transaction,
    userId: string
  ): Promise<TransactionRevenueForLecturer> {
    const transactionPurchase = await this.getTransactionPurchaseForLecturer(
      transaction,
      userId
    );
    return {
      totalRevenue:
        transactionPurchase?.transactionPurchaseItemsForLecturer?.reduce(
          (total, item) =>
            total + item.lecturerShareOfPurchaseItem.lecturerShare,
          0
        ) ?? null
    };
  }

  async getTransactionRevenueForAdmin(
    transaction: Transaction
  ): Promise<TransactionRevenueForAdmin> {
    const transactionPurchase =
      await this.getTransactionPurchaseForAdmin(transaction);
    const lecturersShares: TransactionLecturerRevenueForAdmin[] = [];
    transactionPurchase.transactionPurchaseItems.map(item => {
      for (const lecturerShare of item.lecturersShares) {
        const lecturerRevenue: TransactionLecturerRevenueForAdmin = {
          ...lecturerShare
        };
        const index = lecturersShares.findIndex(
          item =>
            item.lecturerArName == lecturerRevenue.lecturerArName ||
            item.lecturerEnName == lecturerRevenue.lecturerEnName
        );
        if (index > -1) {
          lecturersShares[index].totalLecturerShare +=
            lecturerShare.totalLecturerShare;
          lecturersShares[index].totalSystemShare +=
            lecturerShare.totalSystemShare;
        } else {
          lecturersShares.push(lecturerRevenue);
        }
      }
    });
    return {
      lecturersShares,
      totalVat: transactionPurchase.totalVatAmount,
      subTotal: transactionPurchase.subTotalPrice,
      totalAmount: transaction.totalAmount,
      totalSystemShare: transactionPurchase.totalSystemShare,
      paymentGateWayVatAmount: transactionPurchase.paymentGateWayVatAmount
    };
  }
  /**
   * NOTE: -  vat is calculated after the discount AKA on the finalPrice
   *       -  vat is not calculated before discount and after
   */
  // async getRevenueSharesForTransaction<T extends IPurchasable>(
  //   products: Array<T>,
  //   transaction: Transaction
  // ): Promise<LearningProgramRevenueShare[]> {
  //   const revenueShares = await Promise.all(
  //     products.map(async product => {
  //       const localRevenueShares = await Promise.all(
  //         product.productInfo.map(async productInfo => {
  //           const vatAmount = this.calculateVat(productInfo.finalPrice);
  //           const lecturerShare = await this.calculateLecturerAmount(
  //             productInfo,
  //             vatAmount
  //           );

  //           const localRevenueShare =
  //             await this.revenueShareRepository.createOne({
  //               transactionId: transaction.id,
  //               transaction,
  //               programId: productInfo.id,
  //               programType: productInfo.type,
  //               parentId: productInfo.parentId,
  //               parentType: productInfo.parentType,
  //               totalAmount: productInfo.finalPrice,
  //               vatAmount,
  //               lecturerShare,
  //               lecturerId: productInfo.lecturerId,
  //               systemShare: productInfo.finalPrice - vatAmount - lecturerShare
  //             });

  //           return localRevenueShare;
  //         })
  //       );

  //       return localRevenueShares;
  //     })
  //   );
  //   return revenueShares.flat(1);
  // }

  async getRevenueSharesForTransaction<T extends IPurchasable>(
    products: Array<T>,
    transaction: Transaction
  ): Promise<LearningProgramRevenueShare[]> {
    // get dynamic vat values once
    const { vatPercentage, paymentGatewayVatPercentage } =
      await this.getVatValues();

    const revenueShares = await Promise.all(
      products.map(async product => {
        const localRevenueShares = await Promise.all(
          product.productInfo.map(async productInfo => {
            // calculate vat (course vat only)
            const vatAmount = this.calculateVat(
              productInfo.finalPrice,
              vatPercentage
            );

            // calculate gateway vat
            const paymentGateWayVatAmount = this.calculateGatewayVat(
              productInfo.finalPrice,
              paymentGatewayVatPercentage
            );

            // calculate total deductions BEFORE distribution
            const totalVat = vatAmount + paymentGateWayVatAmount;

            // calculate net amount after all VAT deductions
            const netAmount = Math.max(productInfo.finalPrice - totalVat, 0);

            // pass netAmount instead of vatAmount
            const lecturersShares = await this.calculateLecturerAmount({
              ...productInfo,
              netAmount
            });

            // console.log('🩵 lecturersShares : ');
            // console.log(JSON.stringify(lecturersShares, null, 2));

            const revenueSharesPerLecturer = await Promise.all(
              lecturersShares.map(ls => {
                return this.revenueShareRepository.createOne({
                  transactionId: transaction.id,
                  transaction,
                  programId: productInfo.id,
                  programType: productInfo.type,
                  parentId: productInfo.parentId,
                  parentType: productInfo.parentType,
                  totalAmount: productInfo.finalPrice,
                  vatAmount: 0, // lecturer does not receive vat
                  lecturerShare: ls.share,
                  lecturerId: ls.lecturerId,
                  systemShare: 0,
                  paymentGateWayVatAmount: 0
                });
              })
            );

            const totalLecturerShare = lecturersShares.reduce(
              (acc, curr) => acc + curr.share,
              0
            );

            // ✅ new: system share is now calculated from netAmount
            const systemShare = Math.max(netAmount - totalLecturerShare, 0);

            const systemRevenue = await this.revenueShareRepository.createOne({
              transactionId: transaction.id,
              transaction,
              programId: productInfo.id,
              programType: productInfo.type,
              parentId: productInfo.parentId,
              parentType: productInfo.parentType,
              totalAmount: productInfo.finalPrice,
              vatAmount, // calculate vat here
              lecturerShare: 0,
              lecturerId: null,
              systemShare, // system receives what's left
              paymentGateWayVatAmount // payment gateway vat recorded
            });

            return [...revenueSharesPerLecturer, systemRevenue];
          })
        );

        return localRevenueShares.flat();
      })
    );

    return revenueShares.flat();
  }

  private calculateVat(amount: number, vatPercentage: number): number {
    // if(amount <= 0) return 0
    //NOTE: flooring the vat amount to the nearest integer
    //read this: https://shopify.engineering/eight-tips-for-hanging-pennies
    return Number(
      Math.round((amount * (vatPercentage / 100)) / (1 + vatPercentage / 100)) //flour?
    );
  }

  private calculateGatewayVat(
    amount: number,
    paymentGatewayVatPercentage: number
  ): number {
    return Number(Math.round(amount * (paymentGatewayVatPercentage / 100)));
  }

  private async calculateLecturerAmount<
    T extends IProductInfo & { netAmount: number }
  >(product: T): Promise<Array<{ lecturerId: string; share: number }>> {
    const netAmount = product.netAmount;

    // Fetch all instructors assigned to this course (we will need them regardless)
    const courseLecturers = await this.coureseLecturersRepository.findAll({
      courseId: product.id
    });

    /**
     * FREE / ZERO PRICE CASE
     * Example: Coupon = FREE (100% OFF)
     * In this case → lecturers should appear but with share = 0
     */
    if (netAmount <= 0) {
      return courseLecturers.map(cl => ({
        lecturerId: cl.lecturerId,
        share: 0
      }));
    }

    /**
     * DIPLOMA DISTRIBUTION MODE
     * Works when:
     * - product is part of a Diploma parent
     * - commissionPercentage is NOT null
     *
     * NOTE:
     * - If commissionPercentage = 0 → system takes everything, lecturers get 0
     * - If > 0 → distribute according to rules
     */
    if (
      product.parentType === LearningProgramTypeEnum.DIPLOMA &&
      product.commissionPercentage !== null
    ) {
      // Commission percentage from the net amount
      const commissionPool = Math.floor(
        netAmount * (product.commissionPercentage / 100)
      );

      // Separate lecturers by commission type
      const fixedLecturers = courseLecturers.filter(
        cl => cl.commissionType === CommissionType.FIXED
      );

      const percentageLecturers = courseLecturers.filter(
        cl => cl.commissionType === CommissionType.PERCENTAGE
      );

      // Calculate total fixed shares
      const totalFixed = fixedLecturers.reduce(
        (acc, cl) => acc + (cl.commission || 0),
        0
      );

      // Remaining pool after fixed deductions
      let remainingPool = Math.max(commissionPool - totalFixed, 0);

      // Sum of percentage weights
      const percentWeightSum = percentageLecturers.reduce(
        (acc, cl) => acc + (cl.commission || 0),
        0
      );

      const shares: Array<{ lecturerId: string; share: number }> = [];

      // 1 - Assign fixed amounts first
      for (const cl of fixedLecturers) {
        const share = Math.min(cl.commission || 0, commissionPool); // safety clamp
        shares.push({ lecturerId: cl.lecturerId, share: Math.floor(share) });
      }

      // 2 - Distribute remaining pool to percentage lecturers
      if (remainingPool > 0 && percentWeightSum > 0) {
        let distributed = 0;

        for (let i = 0; i < percentageLecturers.length; i++) {
          const cl = percentageLecturers[i];

          // Last lecturer gets rounding remainder
          const share =
            i === percentageLecturers.length - 1 ?
              Math.max(remainingPool - distributed, 0)
            : Math.floor(
                (remainingPool * (cl.commission || 0)) / percentWeightSum
              );

          distributed += Math.max(share, 0);
          shares.push({ lecturerId: cl.lecturerId, share });
        }
      } else {
        // If no percentage distribution → percentage lecturers get zero
        for (const cl of percentageLecturers) {
          shares.push({ lecturerId: cl.lecturerId, share: 0 });
        }
      }

      return shares;
    }

    /**
     * NORMAL COURSE MODE
     * Used when commissionPercentage === null
     * Means: regular course revenue sharing applies
     */
    return courseLecturers.map(cl => {
      let share = 0;

      if (cl.commissionType === CommissionType.PERCENTAGE) {
        share = Math.floor(netAmount * (cl.commission / 100));
      } else if (cl.commissionType === CommissionType.FIXED) {
        share = cl.commission;
      }

      return { lecturerId: cl.lecturerId, share };
    });
  }

  // async getRevenueSharesForTransaction<T extends IPurchasable>(
  //   products: Array<T>,
  //   transaction: Transaction
  // ): Promise<LearningProgramRevenueShare[]> {
  //   const revenueShares = await Promise.all(
  //     products.map(async product => {
  //       const localRevenueShares = await Promise.all(
  //         product.productInfo.map(async productInfo => {
  //           const vatAmount = this.calculateVat(productInfo.finalPrice);

  //           // console.log('🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠');
  //           // console.log('vatPercentage', this.vatPercentage);
  //           // console.log('vatAmount', vatAmount);
  //           // console.log('-----------------');

  //           const paymentGateWayVatAmount = this.calculateGatewayVat(
  //             productInfo.finalPrice
  //           );

  //           // console.log(
  //           //   'paymentGateWayVatPercentage',
  //           //   this.paymentGatewayVatPercentage
  //           // );
  //           // console.log('paymentGateWayVatAmount', paymentGateWayVatAmount);
  //           // console.log('-----------------');

  //           const lecturersShares = await this.calculateLecturerAmount(
  //             productInfo,
  //             vatAmount + paymentGateWayVatAmount
  //           );

  //           // console.log('lecturersShares', lecturersShares);
  //           // console.log('-----------------');

  //           const revenueSharesPerLecturer = await Promise.all(
  //             lecturersShares.map(ls => {
  //               return this.revenueShareRepository.createOne({
  //                 transactionId: transaction.id,
  //                 transaction,
  //                 programId: productInfo.id,
  //                 programType: productInfo.type,
  //                 parentId: productInfo.parentId,
  //                 parentType: productInfo.parentType,
  //                 totalAmount: productInfo.finalPrice,
  //                 vatAmount: 0,
  //                 lecturerShare: ls.share,
  //                 lecturerId: ls.lecturerId,
  //                 systemShare: 0,
  //                 paymentGateWayVatAmount: 0
  //               });
  //             })
  //           );

  //           const totalLecturerShare = lecturersShares.reduce(
  //             (acc, curr) => acc + curr.share,
  //             0
  //           );

  //           // console.log('totalLecturerShare', totalLecturerShare);

  //           const systemShare =
  //             productInfo.finalPrice -
  //             vatAmount -
  //             totalLecturerShare -
  //             paymentGateWayVatAmount;

  //           // console.log('systemShare', systemShare);
  //           // console.log('-----------------');

  //           const systemRevenue = await this.revenueShareRepository.createOne({
  //             transactionId: transaction.id,
  //             transaction,
  //             programId: productInfo.id,
  //             programType: productInfo.type,
  //             parentId: productInfo.parentId,
  //             parentType: productInfo.parentType,
  //             totalAmount: productInfo.finalPrice,
  //             vatAmount, // calculate vat here
  //             lecturerShare: 0,
  //             lecturerId: null,
  //             systemShare, // calculate system share here,
  //             paymentGateWayVatAmount // calculate payment gateway vat here
  //           });

  //           return [...revenueSharesPerLecturer, systemRevenue];
  //         })
  //       );

  //       return localRevenueShares.flat();
  //     })
  //   );

  //   return revenueShares.flat();
  // }

  // private calculateVat(amount: number): number {
  //   // if(amount <= 0) return 0
  //   //NOTE: flooring the vat amount to the nearest integer
  //   //read this: https://shopify.engineering/eight-tips-for-hanging-pennies
  //   return Number(
  //     Math.round((amount * this.vatPercentage) / (1 + this.vatPercentage)) //flour?
  //   );
  //   // return Number(Math.floor(amount / (1 + this.vatPercentage)));
  // }

  // private calculateGatewayVat(amount: number): number {
  //   return Number(Math.round(amount * this.paymentGatewayVatPercentage)); //flour?
  // }

  // private async calculateLecturerAmount<T extends IProductInfo>(
  //   product: T,
  //   vatAmount: number
  // ): Promise<Array<{ lecturerId: string; share: number }>> {
  //   const netAmount = product.finalPrice - vatAmount;

  //   const courseLecturers = await this.coureseLecturersRepository.findAll({
  //     courseId: product.id
  //   });

  //   return courseLecturers.map(cl => {
  //     let share = 0;
  //     if (cl.commissionType === CommissionType.PERCENTAGE) {
  //       share = Math.floor(netAmount * (cl.commission / 100));
  //     } else if (cl.commissionType === CommissionType.FIXED) {
  //       share = cl.commission;
  //     }

  //     return {
  //       lecturerId: cl.lecturerId,
  //       share
  //     };
  //   });
  // }

  private async getTransactionRevenueShares(
    transaction: Transaction,
    lecturerId: string = null
  ): Promise<LearningProgramRevenueShare[]> {
    return await this.revenueShareRepository.findAll({
      transactionId: transaction.id,
      ...(lecturerId && { lecturerId })
    });
  }

  private async getTransactionPurchase(
    transaction: Transaction
  ): Promise<Purchase> {
    const purchase = await this.purchaseRepository.findOne(
      {
        id: transaction.purchaseId
      },
      ['purchaseItems', 'coupon']
    );

    if (!purchase) {
      throw new BaseHttpException(ErrorCodeEnum.PURCHASE_NOT_FOUND);
    }

    return purchase;
  }

  private async getVatValues(): Promise<{
    vatPercentage: number;
    paymentGatewayVatPercentage: number;
  }> {
    const systemConfig = (await this.systemConfigsRepository.findOne({}))
      ?.dataValues;
    return {
      vatPercentage: systemConfig?.vat ?? 14,
      paymentGatewayVatPercentage: systemConfig?.paymentGatewayVat ?? 2
    };
  }
}
