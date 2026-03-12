import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { PayoutWalletSuccessEvent } from '@src/course/interfaces/assign-user.interface';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { User } from '@src/user/models/user.model';
import { UserRoleEnum } from '@src/user/user.enum';
import { log } from 'console';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import { PAYOUT_WALLET_SUCCESS_EVENT } from '../constants/events-tokens.constants';
import {
  TransactionStateChangeEnum,
  TransactionStatusEnum
} from '../enums/transaction-status.enum';
import { TransactionTypeEnum } from '../enums/transaction-targets.enum';
import {
  WalletOwnerTypeEnum,
  WalletStatusEnum,
  WalletTypeEnum
} from '../enums/wallets.enums';
import {
  LecturersWalletFilterInput,
  PayoutWalletFilterInput,
  WalletFilterInput,
  WalletSortInput
} from '../inputs/wallet.inputs';
import { TransactionPreview } from '../interfaces/transaction-preview.interface';
import {
  AllWalletsBalanceCombined,
  WalletData
} from '../interfaces/wallet-data.object';
import { Transaction } from '../models/transaction.model';
import { WalletTransaction } from '../models/wallet-transaction.model';
import { Wallet } from '../models/wallet.model';
import { TransactionLogService } from './transaction-logs.service';
import { WALLET_JOB } from '../constants/payment.constants';
import { TransactionLog } from '../models/transaction-logs.model';
import { LearningProgramRevenueShare } from '../models/revenue-share.model';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';

@Injectable()
export class WalletService {
  constructor(
    @Inject(Repositories.WalletsRepository)
    private readonly walletsRepository: IRepository<Wallet>,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepository: IRepository<Lecturer>,
    @Inject(Repositories.TransactionsRepository)
    private readonly transactionRepository: IRepository<Transaction>,
    @Inject(Repositories.WALLET_TRANSACTIONS_REPOSITORY)
    private readonly walletTransactionRepo: IRepository<WalletTransaction>,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    private readonly eventEmitter: EventEmitter2,
    private readonly transactionLogService: TransactionLogService
  ) {}

  async getWallets(
    filter: WalletFilterInput,
    sort: WalletSortInput,
    paginate: PaginatorInput
  ): Promise<PaginationRes<Wallet>> {
    return await this.walletsRepository.findPaginated(
      {
        ...(filter?.owner && {
          ownerId: filter?.owner?.id,
          ownerType: filter?.owner?.type
        }),
        ...(filter?.status && { status: filter?.status }),
        ...(filter?.type && { type: filter?.type }),
        ...(filter?.balance && {
          balance: {
            [Op.gt]: filter?.balance?.from ?? 0,
            [Op.lte]: filter?.balance?.to ?? Infinity
          }
        }),
        balance: { [Op.gt]: 0 }
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

  async getAllWalletsBalanceCompined(): Promise<AllWalletsBalanceCombined> {
    const wallets = await this.walletsRepository.findAll({
      status: WalletStatusEnum.ACTIVE
    });
    let VAT_WALLET = 0,
      SYS_WALLET = 0,
      LECTURER_WALLET = 0,
      PENDING_LECTURER_WALLET = 0,
      STRIP_WALLET = 0,
      PENDING_PAYOUT_WALLET = 0,
      SUCCESS_PAYOUT_WALLET = 0;

    for (const wallet of wallets) {
      if (wallet.type === WalletTypeEnum.VAT_WALLET) {
        VAT_WALLET += wallet.balance;
      } else if (wallet.type === WalletTypeEnum.SYS_WALLET) {
        SYS_WALLET += wallet.balance;
      } else if (wallet.type === WalletTypeEnum.LECTURER_WALLET) {
        LECTURER_WALLET += wallet.balance;
      } else if (wallet.type === WalletTypeEnum.PENDING_LECTURER_WALLET) {
        PENDING_LECTURER_WALLET += wallet.balance;
      } else if (wallet.type === WalletTypeEnum.STRIP_WALLET) {
        STRIP_WALLET += wallet.balance;
      } else if (wallet.type === WalletTypeEnum.PENDING_PAYOUT_WALLET) {
        PENDING_PAYOUT_WALLET += wallet.balance;
      } else if (wallet.type === WalletTypeEnum.SUCCESS_PAYOUT_WALLET) {
        SUCCESS_PAYOUT_WALLET += wallet.balance;
      }
    }

    return {
      VAT_WALLET,
      SYS_WALLET,
      LECTURER_WALLET,
      PENDING_LECTURER_WALLET,
      STRIP_WALLET,
      PENDING_PAYOUT_WALLET,
      SUCCESS_PAYOUT_WALLET
    };
  }

  async getPayoutWallets(
    filter?: PayoutWalletFilterInput,
    sort?: WalletSortInput,
    paginate?: PaginatorInput
  ): Promise<PaginationRes<Wallet>> {
    let lecturersFilter: WhereOptions<Wallet> = {
      ownerId: null
    };
    if (filter?.searchKeyForLecturer) {
      lecturersFilter = {
        ownerId: {
          [Op.in]: (
            await this.lecturerRepository.findAll(undefined, [
              {
                model: User,
                where: {
                  [Op.or]: [
                    {
                      arFullName: {
                        [Op.iLike]: `%${filter?.searchKeyForLecturer}%`
                      }
                    },
                    {
                      enFullName: {
                        [Op.iLike]: `%${filter?.searchKeyForLecturer}%`
                      }
                    }
                  ]
                }
              }
            ])
          ).map(lecturer => lecturer.id)
        }
      };
    }

    return await this.walletsRepository.findPaginated(
      {
        ...(filter?.owner && {
          ownerId: filter?.owner?.id,
          ownerType: filter?.owner?.type
        }),
        ...(filter?.searchKeyForLecturer && lecturersFilter),
        ...(filter?.status && { status: filter?.status }),
        ...(filter?.type ?
          { type: filter?.type }
        : {
            [Op.or]: [
              {
                type: WalletTypeEnum.PENDING_PAYOUT_WALLET
              },
              {
                type: WalletTypeEnum.SUCCESS_PAYOUT_WALLET
              }
            ]
          }),
        ...(filter?.balance ?
          {
            balance: {
              [Op.gt]: filter?.balance?.from ?? 0,
              [Op.lte]: filter?.balance?.to ?? Infinity
            }
          }
        : { balance: { [Op.gt]: 0 } })
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
  async getMyPayoutWalletsForLecturer(
    filter: PayoutWalletFilterInput,
    sort: WalletSortInput,
    paginate: PaginatorInput,
    user: User
  ): Promise<PaginationRes<Wallet>> {
    const lecturer = await this.lecturerRepository.findOne({
      userId: user.id
    });
    return await this.walletsRepository.findPaginated(
      {
        ...(filter?.status && { status: filter?.status }),
        ...(filter?.type != null ?
          { type: filter?.type }
        : {
            type: {
              [Op.or]: [
                WalletTypeEnum.PENDING_PAYOUT_WALLET,
                WalletTypeEnum.SUCCESS_PAYOUT_WALLET
              ]
            }
          }),
        ...(filter?.balance && {
          balance: {
            [Op.gt]: filter?.balance?.from ?? 0,
            [Op.lte]: filter?.balance?.to ?? Infinity
          }
        }),
        balance: { [Op.gt]: 0 },
        ownerId: lecturer.id,
        ownerType: WalletOwnerTypeEnum.LECTURER
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

  async getLecturersWallets(
    filter: LecturersWalletFilterInput,
    sort: WalletSortInput,
    paginate: PaginatorInput
  ): Promise<PaginationRes<Wallet>> {
    return await this.walletsRepository.findPaginated(
      {
        //TODO: add wallet title search
        // ...(filter?.searchKey && {
        //   [Op.or]: [
        //     { enTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
        //     { arTitle: { [Op.iLike]: `%${filter?.searchKey}%` } }
        //   ]
        // }),
        ...(filter?.owner && {
          ownerId: filter?.owner?.id,
          ownerType: filter?.owner?.type
        }),
        ...(filter?.status && { status: filter?.status }),
        ...(filter?.type !== null ?
          { type: filter?.type }
        : {
            type: {
              [Op.or]: [
                WalletTypeEnum.PENDING_LECTURER_WALLET,
                WalletTypeEnum.LECTURER_WALLET
              ]
            }
          }),
        ...(filter?.balance && {
          balance: {
            [Op.gt]: filter?.balance?.from ?? 0,
            [Op.lte]: filter?.balance?.to ?? Infinity
          }
        }),
        balance: { [Op.gt]: 0 }
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

  async getWallet(id: string): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({ id });
    if (!wallet) {
      throw new BaseHttpException(ErrorCodeEnum.WALLET_NOT_FOUND);
    }
    return wallet;
  }

  async getMyWallet(user: User): Promise<Wallet> {
    if (user?.role === UserRoleEnum.ADMIN || user?.role === UserRoleEnum.USER) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_ROLE);
    }

    const lecturer = await this.lecturerRepository.findOne({
      userId: user?.id
    });

    const lecturerId = lecturer?.id;

    const wallet = await this.walletsRepository.findOne({
      ownerId: lecturerId,
      ownerType: WalletOwnerTypeEnum.LECTURER,
      type: WalletTypeEnum.LECTURER_WALLET
    });

    if (!wallet) {
      throw new BaseHttpException(ErrorCodeEnum.WALLET_NOT_FOUND);
    }
    return wallet;
  }

  async getLectureWalletsData(user: User): Promise<WalletData> {
    if (user?.role === UserRoleEnum.ADMIN || user?.role === UserRoleEnum.USER) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_ROLE);
    }

    const lecturer = await this.lecturerRepository.findOne({
      userId: user?.id
    });

    const lecturerId = lecturer?.id;

    const pendingLecturerWallet = await this.walletsRepository.findOne({
      ownerId: lecturerId,
      ownerType: WalletOwnerTypeEnum.LECTURER,
      type: WalletTypeEnum.PENDING_LECTURER_WALLET
    });

    const availableBalanceWallet = await this.walletsRepository.findOne({
      ownerId: lecturerId,
      ownerType: WalletOwnerTypeEnum.LECTURER,
      type: WalletTypeEnum.LECTURER_WALLET
    });

    const pendingPayoutBalanceWallet = await this.walletsRepository.findOne({
      ownerId: lecturerId,
      ownerType: WalletOwnerTypeEnum.LECTURER,
      type: WalletTypeEnum.PENDING_PAYOUT_WALLET
    });

    const withdrawnBalanceWallet = await this.walletsRepository.findOne({
      ownerId: lecturerId,
      ownerType: WalletOwnerTypeEnum.LECTURER,
      type: WalletTypeEnum.SUCCESS_PAYOUT_WALLET
    });

    const pendingBalance = pendingLecturerWallet?.balance ?? 0;
    const availableBalance = availableBalanceWallet?.balance ?? 0;
    const pendingPayoutBalance = pendingPayoutBalanceWallet?.balance ?? 0;
    const withdrawnBalance = withdrawnBalanceWallet?.balance ?? 0;

    return {
      pendingBalance,
      availableBalance,
      pendingPayoutBalance,
      withdrawnBalance
    };
  }

  async getLecturerWalletsDataByAdmin(lecturerId: string): Promise<WalletData> {
    const lecturer = await this.lecturerRepository.findOne({
      id: lecturerId
    });

    if (!lecturer) {
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_DOESNT_EXIST);
    }

    const [
      pendingLecturerWallet,
      availableBalanceWallet,
      pendingPayoutBalanceWallet,
      withdrawnBalanceWallet
    ] = await Promise.all([
      this.walletsRepository.findOne({
        ownerId: lecturerId,
        ownerType: WalletOwnerTypeEnum.LECTURER,
        type: WalletTypeEnum.PENDING_LECTURER_WALLET
      }),
      this.walletsRepository.findOne({
        ownerId: lecturerId,
        ownerType: WalletOwnerTypeEnum.LECTURER,
        type: WalletTypeEnum.LECTURER_WALLET
      }),
      this.walletsRepository.findOne({
        ownerId: lecturerId,
        ownerType: WalletOwnerTypeEnum.LECTURER,
        type: WalletTypeEnum.PENDING_PAYOUT_WALLET
      }),
      this.walletsRepository.findOne({
        ownerId: lecturerId,
        ownerType: WalletOwnerTypeEnum.LECTURER,
        type: WalletTypeEnum.SUCCESS_PAYOUT_WALLET
      })
    ]);

    return {
      pendingBalance: pendingLecturerWallet?.balance ?? 0,
      availableBalance: availableBalanceWallet?.balance ?? 0,
      pendingPayoutBalance: pendingPayoutBalanceWallet?.balance ?? 0,
      withdrawnBalance: withdrawnBalanceWallet?.balance ?? 0
    };
  }

  async getLecturerBalance(lecturerId: string): Promise<number> {
    return (
      (
        await this.walletsRepository.findOne({
          ownerId: lecturerId,
          type: WalletTypeEnum.LECTURER_WALLET
        })
      )?.balance ?? 0
    );
  }

  async updateWalletStatus(
    walletId: string,
    status: WalletStatusEnum
  ): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({ id: walletId });
    if (!wallet) {
      throw new BaseHttpException(ErrorCodeEnum.WALLET_NOT_FOUND);
    }

    return await this.walletsRepository.updateOneFromExistingModel(wallet, {
      status
    });
  }

  //(soft delete)
  async deleteWallet(walletId: string): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({
      id: walletId,
      deletedAt: { [Op.is]: null }
    });
    if (!wallet) {
      throw new BaseHttpException(ErrorCodeEnum.WALLET_NOT_FOUND);
    }

    return await this.walletsRepository.updateOne(
      { id: wallet.id },
      {
        deletedAt: new Date()
      }
    );
  }

  async linkWalletsToTransaction(transaction: Transaction): Promise<void> {
    const systemWallet = await this.walletsRepository.findOrCreate(
      {
        type: WalletTypeEnum.SYS_WALLET,
        ownerType: WalletOwnerTypeEnum.SYSTEM
      },
      {
        type: WalletTypeEnum.SYS_WALLET,
        ownerType: WalletOwnerTypeEnum.SYSTEM,
        status: WalletStatusEnum.ACTIVE,
        balance: 0
      }
    );
    //link transaction to system wallet
    await this.addTransactionToWallet(transaction, systemWallet);

    const vatWallet = await this.walletsRepository.findOrCreate(
      {
        type: WalletTypeEnum.VAT_WALLET,
        ownerType: WalletOwnerTypeEnum.SYSTEM
      },
      {
        type: WalletTypeEnum.VAT_WALLET,
        ownerType: WalletOwnerTypeEnum.SYSTEM,
        status: WalletStatusEnum.ACTIVE,
        balance: 0
      }
    );
    //link transaction to vat wallet
    await this.addTransactionToWallet(transaction, vatWallet);

    const paymentGatewayWallet = await this.walletsRepository.findOrCreate(
      {
        type: WalletTypeEnum.PAYMENT_GATEWAY_VAT_WALLET,
        ownerType: WalletOwnerTypeEnum.SYSTEM
      },
      {
        type: WalletTypeEnum.PAYMENT_GATEWAY_VAT_WALLET,
        ownerType: WalletOwnerTypeEnum.SYSTEM,
        status: WalletStatusEnum.ACTIVE,
        balance: 0
      }
    );
    //link transaction to vat wallet
    await this.addTransactionToWallet(transaction, paymentGatewayWallet);

    for (const revenue of transaction.revenueShares) {
      // skip if there is no lecturer, it will be a revenue for system share and vat amount
      if (!revenue.lecturerId) continue;
      const pendingLecturerWallet = await this.walletsRepository.findOrCreate(
        {
          ownerId: revenue.lecturerId,
          ownerType: WalletOwnerTypeEnum.LECTURER,
          type: WalletTypeEnum.PENDING_LECTURER_WALLET
        },
        {
          ownerId: revenue.lecturerId,
          ownerType: WalletOwnerTypeEnum.LECTURER,
          type: WalletTypeEnum.PENDING_LECTURER_WALLET,
          status: WalletStatusEnum.ACTIVE,
          balance: 0
        }
      );
      //link transaction to pending lecturer wallet
      await this.addTransactionToWallet(transaction, pendingLecturerWallet);
    }
  }

  async getWalletTransaction(wallet: Wallet): Promise<TransactionPreview> {
    const transaction = (
      await this.transactionRepository.findAll(
        {
          status: {
            [Op.and]: [
              { [Op.not]: TransactionStatusEnum.PENDING },
              { [Op.not]: TransactionStatusEnum.CANCELED },
              { [Op.not]: TransactionStatusEnum.EXPIRED },
              { [Op.not]: TransactionStatusEnum.FAILED }
            ]
          }
        },
        [
          {
            model: Wallet,
            where: {
              id: wallet.id
            }
          }
        ],
        [[Sequelize.col('updatedAt'), SortTypeEnum.DESC]]
      )
    )[0];

    if (!transaction) {
      return {
        id: 'NO_TRANSACTION',
        code: 'NO_CODE',
        status: TransactionStatusEnum.PENDING
      };
    }

    return {
      id: transaction.id,
      code: transaction.code,
      status: transaction.status
    };
  }

  //NOTE DEEP WALLET BALANCE UPDATE LOGIC------------
  //meaning that we will update the balance of the pending payout wallet and the lecturer wallet which aren't on the surface logic
  async transferFromLecturerWalletsToPendingPayoutWallets(): Promise<void> {
    try {
      // log('transferFromLecturerWalletsToPendingPayoutWallets');
      //1. get lecturers wallets
      const lecturersWallets = await this.walletsRepository.findAll(
        {
          status: WalletStatusEnum.ACTIVE,
          type: WalletTypeEnum.LECTURER_WALLET
        },
        [
          {
            model: Transaction,
            as: 'transactions'
          }
        ]
      );
      // log('lecturersWallets', lecturersWallets);

      //2. update PendingPayout wallets
      for (const lecturerWallet of lecturersWallets) {
        const lecturerPendingPayoutWallet =
          await this.walletsRepository.findOrCreate(
            {
              ownerId: lecturerWallet.ownerId,
              type: WalletTypeEnum.PENDING_PAYOUT_WALLET
            },
            {
              ownerId: lecturerWallet.ownerId,
              ownerType: WalletOwnerTypeEnum.LECTURER,
              type: WalletTypeEnum.PENDING_PAYOUT_WALLET,
              status: WalletStatusEnum.ACTIVE,
              balance: 0
            }
          );
        //2.1. add transactions to pending payout wallet
        await this.addTransactionsToWallet(
          lecturerWallet.transactions,
          lecturerPendingPayoutWallet
        );

        //2.2.  mutate lecturer pending wallet balance to the balance of the lecturer wallet
        lecturerPendingPayoutWallet.balance += lecturerWallet.balance;
        await lecturerPendingPayoutWallet.save();

        //2.3. mutate pending lecturer wallet balance to 0
        lecturerWallet.balance = 0;
        await lecturerWallet.save();
      }
    } catch (error) {
      log('error', error);
      throw error;
    }
  }

  // async transferFromPendingLecturerWalletsToLecturerWallets(): Promise<void> {
  //   try {
  //     // log('transferFromPendingLecturerWalletsToLecturerWallets');
  //     const previous48Hours = new Date();
  //     previous48Hours.setDate(previous48Hours.getDate() - 2);

  //     const previous2Minutes = new Date();
  //     previous2Minutes.setMinutes(previous2Minutes.getMinutes() - 2);

  //     //1. get pending lecturer wallets with balance which are older than 2 days
  //     const pendingLecturerWallets = await this.walletsRepository.findAll(
  //       {
  //         status: WalletStatusEnum.ACTIVE,
  //         type: WalletTypeEnum.PENDING_LECTURER_WALLET,
  //         updatedAt: {
  //           // [Op.lt]: previous48Hours
  //           [Op.lt]: previous2Minutes
  //         }
  //       },
  //       [
  //         {
  //           model: Transaction,
  //           as: 'transactions'
  //         }
  //       ]
  //     );
  //     // log('pendingLecturerWallets', pendingLecturerWallets);

  //     //2. update lecturer wallets
  //     for (const pendingLecturerWallet of pendingLecturerWallets) {
  //       const lecturerWallet = await this.walletsRepository.findOrCreate(
  //         {
  //           ownerId: pendingLecturerWallet.ownerId,
  //           type: WalletTypeEnum.LECTURER_WALLET
  //         },
  //         {
  //           ownerId: pendingLecturerWallet.ownerId,
  //           ownerType: WalletOwnerTypeEnum.LECTURER,
  //           type: WalletTypeEnum.LECTURER_WALLET,
  //           status: WalletStatusEnum.ACTIVE,
  //           balance: 0
  //         }
  //       );

  //       const validTransactions = pendingLecturerWallet.transactions.filter(
  //         tx => tx.type !== TransactionTypeEnum.PAYOUT
  //       );

  //       // const validTransactions = pendingLecturerWallet.transactions;

  //       //2.1. add transactions to lecturer wallet
  //       await this.addTransactionsToWallet(validTransactions, lecturerWallet);

  //       //2.2.  mutate lecturer pendingLecturerWallet balance
  //       lecturerWallet.balance += pendingLecturerWallet.balance;
  //       await lecturerWallet.save();

  //       //2.3. mutate pending lecturer pendingLecturerWallet balance
  //       pendingLecturerWallet.balance = 0;
  //       await pendingLecturerWallet.save();
  //     }
  //   } catch (error) {
  //     log('error', error);
  //     throw error;
  //   }
  // }

  async transferFromPendingLecturerWalletsToLecturerWallets(): Promise<void> {
    try {
      const previousTime = new Date();
      if (process.env.NODE_ENV === 'production') {
        // production -> 48 hours
        previousTime.setDate(previousTime.getDate() - 2);
      } else {
        // staging -> 2 minutes
        previousTime.setMinutes(previousTime.getMinutes() - 2);
      }

      // fetch all active pending lecturer wallets updated before 2 minutes ago
      const pendingLecturerWallets = await this.walletsRepository.findAll(
        {
          status: WalletStatusEnum.ACTIVE,
          type: WalletTypeEnum.PENDING_LECTURER_WALLET,
          updatedAt: {
            [Op.lt]: previousTime
          }
        },
        [
          {
            model: Transaction,
            as: 'transactions',
            include: [
              {
                model: LearningProgramRevenueShare,
                as: 'revenueShares'
              }
            ]
          }
        ]
      );

      for (const pendingWallet of pendingLecturerWallets) {
        // find or create lecturer wallet
        const lecturerWallet = await this.walletsRepository.findOrCreate(
          {
            ownerId: pendingWallet.ownerId,
            type: WalletTypeEnum.LECTURER_WALLET
          },
          {
            ownerId: pendingWallet.ownerId,
            ownerType: WalletOwnerTypeEnum.LECTURER,
            type: WalletTypeEnum.LECTURER_WALLET,
            status: WalletStatusEnum.ACTIVE,
            balance: 0
          }
        );

        for (const transaction of pendingWallet.transactions) {
          await this.safeAddTransactionToWallet(transaction, lecturerWallet);
        }

        // transfer balance from pending to lecturer wallet
        lecturerWallet.balance += pendingWallet.balance;
        await lecturerWallet.save();

        // reset pending wallet balance
        pendingWallet.balance = 0;
        await pendingWallet.save();
      }
    } catch (error) {
      log('error', error);
      throw error;
    }
  }

  // add transaction to wallet safely
  private async safeAddTransactionToWallet(
    transaction: Transaction,
    wallet: Wallet
  ): Promise<void> {
    await this.sequelize.transaction(async t => {
      // check if this wallet already has this transaction
      const walletWithTransactions = await this.walletsRepository.findOne(
        { id: wallet.id },
        [
          {
            model: Transaction,
            as: 'transactions',
            where: { id: transaction.id }
          }
        ],
        undefined,
        undefined,
        t
      );

      const alreadyExists = walletWithTransactions?.transactions?.length > 0;

      if (alreadyExists) return;

      // create walletTransaction
      await this.walletTransactionRepo.createOne(
        { transactionId: transaction.id, walletId: wallet.id },
        t
      );

      // check if transaction can be finalized as PAYOUT
      await this.checkAndFinalizeTransactionPayout(transaction, t);
    });
  }

  // finalize transaction type as PAYOUT if distributed to all lecturers
  private async checkAndFinalizeTransactionPayout(
    transaction: Transaction,
    t?: any
  ): Promise<void> {
    // count unique lecturers required
    const requiredLecturersCount = transaction.revenueShares
      .map(r => r.lecturerId)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i).length;

    // fetch all lecturer wallets that have this transaction (via join)
    const lecturerWalletsWithTransaction = await this.walletsRepository.findAll(
      {
        type: WalletTypeEnum.LECTURER_WALLET
      },
      [
        {
          model: Transaction,
          as: 'transactions',
          where: { id: transaction.id }
        }
      ],
      undefined,
      undefined,
      undefined,
      t
    );

    const distributedLecturerWalletsCount =
      lecturerWalletsWithTransaction.length;

    // if not fully distributed, skip
    if (distributedLecturerWalletsCount < requiredLecturersCount) return;

    // mark transaction as PAYOUT
    if (transaction.type !== TransactionTypeEnum.PAYOUT) {
      transaction.type = TransactionTypeEnum.PAYOUT;
      await transaction.save({ transaction: t });
    }
  }

  async handleWalletsStateMutations(transaction: Transaction): Promise<void> {
    const wallets = await this.walletsRepository.findAll({}, [
      {
        model: Transaction,
        where: {
          id: transaction.id
        }
      }
    ]);

    // ensure that we have all required wallets
    const requiredWalletsExists = [
      WalletTypeEnum.VAT_WALLET,
      WalletTypeEnum.PAYMENT_GATEWAY_VAT_WALLET,
      WalletTypeEnum.SYS_WALLET,
      WalletTypeEnum.PENDING_LECTURER_WALLET
    ].every(type => wallets.some(wallet => wallet.type === type));

    if (!requiredWalletsExists || wallets.length === 0) {
      throw new BaseHttpException(ErrorCodeEnum.WALLETS_NOT_FOUND);
    }

    if (
      transaction.status === TransactionStatusEnum.CANCELED ||
      transaction.status === TransactionStatusEnum.REFUNDED
    ) {
      await this.updateStripeWalletBalanceOnCancelOrRefund(transaction);
    }
    for (const wallet of wallets) {
      // console.log('wallet.type :', wallet.type);
      await this.updateWalletStateOnTransactionState(transaction, wallet);
    }
  }

  async updatePayoutWalletState(
    walletId: string,
    updateTo: 'success' | 'canceled',
    user: User
  ): Promise<Wallet> {
    const payoutWallet = await this.walletsRepository.findOne(
      {
        id: walletId
      },
      [
        {
          model: Transaction,
          as: 'transactions'
        }
      ]
    );

    if (!payoutWallet) {
      throw new BaseHttpException(ErrorCodeEnum.WALLET_NOT_FOUND);
    }

    switch (payoutWallet.type) {
      case WalletTypeEnum.PENDING_PAYOUT_WALLET: {
        switch (updateTo) {
          case 'success':
            return await this.updatePayoutWalletStateToSuccessPayout(
              payoutWallet,
              user
            );
          case 'canceled':
            return await this.updatePayoutWalletStateToCanceledPayout(
              payoutWallet,
              user
            );
          default:
            throw new BaseHttpException(
              ErrorCodeEnum.GENERAL_INVALID_TRANSACTION_STATUS
            );
        }
      }
      case WalletTypeEnum.SUCCESS_PAYOUT_WALLET: {
        switch (updateTo) {
          case 'canceled':
            return await this.updateSuccessPayoutWalletStateToCanceledPayout(
              payoutWallet,
              user
            );
          default:
            throw new BaseHttpException(
              ErrorCodeEnum.INVALID_PAYOUT_WALLET_TRANSITION_STATUS
            );
        }
      }
      default:
        throw new BaseHttpException(ErrorCodeEnum.INVALID_WALLET_TYPE);
    }
  }

  private async updatePayoutWalletStateToSuccessPayout(
    pendingPayoutWallet: Wallet,
    changedBy: User
  ): Promise<Wallet> {
    const successPayoutWallet = await this.walletsRepository.findOrCreate(
      {
        ownerId: pendingPayoutWallet.ownerId,
        type: WalletTypeEnum.SUCCESS_PAYOUT_WALLET
      },
      {
        ownerId: pendingPayoutWallet.ownerId,
        ownerType: pendingPayoutWallet.ownerType,
        type: WalletTypeEnum.SUCCESS_PAYOUT_WALLET,
        status: WalletStatusEnum.ACTIVE,
        balance: 0
      }
    );
    //1. add transactions to success payout wallet
    await this.addTransactionsToWallet(
      pendingPayoutWallet.transactions,
      successPayoutWallet
    );

    //2. update success payout wallet balance
    successPayoutWallet.balance += pendingPayoutWallet.balance;
    await successPayoutWallet.save();

    //3. update pending payout wallet balance
    pendingPayoutWallet.balance = 0;
    await pendingPayoutWallet.save();

    const lecturerTransactions = await this.transactionRepository.findAll({
      id: { [Op.in]: pendingPayoutWallet.transactions.map(trx => trx.id) }
    });

    //4. update Relevant Transactions log
    for (const lecturerTransaction of lecturerTransactions) {
      await this.transactionLogService.createTransactionLog({
        transaction: lecturerTransaction,
        status: lecturerTransaction.status,
        change: TransactionStateChangeEnum.CONFIRM_PAYOUT,
        changedBy
      });
    }

    this.eventEmitter.emitAsync(
      PAYOUT_WALLET_SUCCESS_EVENT,
      this.getPayoutWalletSuccessEvent(successPayoutWallet.id)
    );

    return pendingPayoutWallet;
  }

  private async updatePayoutWalletStateToCanceledPayout(
    pendingPayoutWallet: Wallet,
    changedBy: User
  ): Promise<Wallet> {
    const lecturerWallet = await this.walletsRepository.findOne(
      {
        ownerId: pendingPayoutWallet.ownerId,
        type: WalletTypeEnum.LECTURER_WALLET
      },
      [
        {
          model: Transaction,
          as: 'transactions'
        }
      ]
    );
    //1. add transactions to lecturer wallet
    await this.addTransactionsToWallet(
      pendingPayoutWallet.transactions,
      lecturerWallet
    );

    //2. update success payout wallet balance
    lecturerWallet.balance += pendingPayoutWallet.balance;
    await lecturerWallet.save();

    //3. update pending payout wallet balance
    pendingPayoutWallet.balance = 0;
    await pendingPayoutWallet.save();

    //4. update cancel payout wallet transactions
    const lecturerTransactions = await this.transactionRepository.findAll({
      id: { [Op.in]: pendingPayoutWallet.transactions.map(trx => trx.id) }
    });

    for (const lecturerTransaction of lecturerTransactions) {
      await this.transactionLogService.createTransactionLog({
        transaction: lecturerTransaction,
        status: lecturerTransaction.status,
        change: TransactionStateChangeEnum.CANCEL_PAYOUT,
        changedBy
      });
    }

    return pendingPayoutWallet;
  }

  private async updateSuccessPayoutWalletStateToCanceledPayout(
    successPayoutWallet: Wallet,
    changedBy: User
  ): Promise<Wallet> {
    const pendingPayoutWallet = await this.walletsRepository.findOne(
      {
        ownerId: successPayoutWallet.ownerId,
        type: WalletTypeEnum.PENDING_PAYOUT_WALLET
      },
      [
        {
          model: Transaction,
          as: 'transactions'
        }
      ]
    );
    //1. add transactions to pending payout wallet
    await this.addTransactionsToWallet(
      successPayoutWallet.transactions,
      pendingPayoutWallet
    );

    //2. update pending payout wallet balance
    pendingPayoutWallet.balance += successPayoutWallet.balance;
    await pendingPayoutWallet.save();

    //3. update success payout wallet balance
    successPayoutWallet.balance = 0;
    await successPayoutWallet.save();

    //4. update cancel payout wallet transactions
    const lecturerTransactions = await this.transactionRepository.findAll({
      id: { [Op.in]: pendingPayoutWallet.transactions.map(trx => trx.id) }
    });

    for (const lecturerTransaction of lecturerTransactions) {
      await this.transactionLogService.createTransactionLog({
        transaction: lecturerTransaction,
        status: lecturerTransaction.status,
        change: TransactionStateChangeEnum.CANCEL_PAYOUT,
        changedBy
      });
    }
    return successPayoutWallet;
  }

  // -----------

  async updatePayoutWalletStateByTransactions(
    walletId: string,
    transactionIds: string[],
    updateTo: 'success' | 'canceled',
    user: User
  ): Promise<Wallet> {
    const payoutWallet = await this.walletsRepository.findOne(
      { id: walletId },
      [
        {
          model: Transaction,
          as: 'transactions',
          include: [
            { model: LearningProgramRevenueShare, as: 'revenueShares' },
            {
              model: TransactionLog,
              as: 'logs'
            }
          ]
        }
      ]
    );

    if (!payoutWallet)
      throw new BaseHttpException(ErrorCodeEnum.WALLET_NOT_FOUND);

    const selectedTransactions = payoutWallet.transactions.filter(trx =>
      transactionIds.includes(trx.id)
    );

    if (!selectedTransactions.length) return payoutWallet;

    switch (payoutWallet.type) {
      case WalletTypeEnum.PENDING_PAYOUT_WALLET: {
        switch (updateTo) {
          case 'success':
            return await this.updatePendingPayoutWalletToSuccessByTransactions(
              payoutWallet,
              selectedTransactions,
              user
            );
          case 'canceled':
            return await this.updatePendingPayoutWalletToCanceledByTransactions(
              payoutWallet,
              selectedTransactions,
              user
            );
          default:
            throw new BaseHttpException(
              ErrorCodeEnum.GENERAL_INVALID_TRANSACTION_STATUS
            );
        }
      }

      case WalletTypeEnum.SUCCESS_PAYOUT_WALLET: {
        switch (updateTo) {
          case 'canceled':
            return await this.updateSuccessPayoutWalletToCanceledByTransactions(
              payoutWallet,
              selectedTransactions,
              user
            );
          default:
            throw new BaseHttpException(
              ErrorCodeEnum.INVALID_PAYOUT_WALLET_TRANSITION_STATUS
            );
        }
      }

      default:
        throw new BaseHttpException(ErrorCodeEnum.INVALID_WALLET_TYPE);
    }
  }

  private async updatePendingPayoutWalletToSuccessByTransactions(
    pendingPayoutWallet: Wallet,
    transactions: Transaction[],
    changedBy: User
  ): Promise<Wallet> {
    this.validatePayoutTransactions({
      wallet: pendingPayoutWallet,
      transactions,
      expectedWalletType: WalletTypeEnum.PENDING_PAYOUT_WALLET,
      allowedLastChanges: [
        TransactionStateChangeEnum.TRANSACTION_FULFILLED,
        TransactionStateChangeEnum.CANCEL_PAYOUT
      ]
    });
    const successPayoutWallet = await this.walletsRepository.findOrCreate(
      {
        ownerId: pendingPayoutWallet.ownerId,
        type: WalletTypeEnum.SUCCESS_PAYOUT_WALLET
      },
      {
        ownerId: pendingPayoutWallet.ownerId,
        ownerType: pendingPayoutWallet.ownerType,
        type: WalletTypeEnum.SUCCESS_PAYOUT_WALLET,
        status: WalletStatusEnum.ACTIVE,
        balance: 0
      }
    );

    await this.addTransactionsToWallet(transactions, successPayoutWallet);

    const totalAmount = await this.calculateTotalAmount(
      transactions,
      successPayoutWallet
    );

    successPayoutWallet.balance += totalAmount;
    await successPayoutWallet.save();

    pendingPayoutWallet.balance -= totalAmount;
    await pendingPayoutWallet.save();

    for (const trx of transactions) {
      await this.transactionLogService.createTransactionLog({
        transaction: trx,
        status: trx.status,
        change: TransactionStateChangeEnum.CONFIRM_PAYOUT,
        changedBy
      });
    }

    return pendingPayoutWallet;
  }

  private async updatePendingPayoutWalletToCanceledByTransactions(
    pendingPayoutWallet: Wallet,
    transactions: Transaction[],
    changedBy: User
  ): Promise<Wallet> {
    this.validatePayoutTransactions({
      wallet: pendingPayoutWallet,
      transactions,
      expectedWalletType: WalletTypeEnum.PENDING_PAYOUT_WALLET,
      allowedLastChanges: [
        TransactionStateChangeEnum.TRANSACTION_FULFILLED,
        TransactionStateChangeEnum.CANCEL_PAYOUT
      ]
    });
    const lecturerWallet = await this.walletsRepository.findOne(
      {
        ownerId: pendingPayoutWallet.ownerId,
        type: WalletTypeEnum.LECTURER_WALLET
      },
      [{ model: Transaction, as: 'transactions' }]
    );

    await this.addTransactionsToWallet(transactions, lecturerWallet);

    const totalAmount = await this.calculateTotalAmount(
      transactions,
      lecturerWallet
    );

    console.log('totalAmount', totalAmount);

    lecturerWallet.balance += totalAmount;
    await lecturerWallet.save();

    pendingPayoutWallet.balance -= totalAmount;
    await pendingPayoutWallet.save();

    for (const trx of transactions) {
      await this.transactionLogService.createTransactionLog({
        transaction: trx,
        status: trx.status,
        change: TransactionStateChangeEnum.CANCEL_PAYOUT,
        changedBy
      });
    }

    return pendingPayoutWallet;
  }

  private async updateSuccessPayoutWalletToCanceledByTransactions(
    successPayoutWallet: Wallet,
    transactions: Transaction[],
    changedBy: User
  ): Promise<Wallet> {
    this.validatePayoutTransactions({
      wallet: successPayoutWallet,
      transactions,
      expectedWalletType: WalletTypeEnum.SUCCESS_PAYOUT_WALLET,
      allowedLastChanges: [TransactionStateChangeEnum.CONFIRM_PAYOUT]
    });
    const pendingPayoutWallet = await this.walletsRepository.findOne(
      {
        ownerId: successPayoutWallet.ownerId,
        type: WalletTypeEnum.PENDING_PAYOUT_WALLET
      },
      [{ model: Transaction, as: 'transactions' }]
    );

    await this.addTransactionsToWallet(transactions, pendingPayoutWallet);

    const totalAmount = await this.calculateTotalAmount(
      transactions,
      pendingPayoutWallet
    );

    pendingPayoutWallet.balance += totalAmount;
    await pendingPayoutWallet.save();

    successPayoutWallet.balance -= totalAmount;
    await successPayoutWallet.save();

    for (const trx of transactions) {
      await this.transactionLogService.createTransactionLog({
        transaction: trx,
        status: trx.status,
        change: TransactionStateChangeEnum.CANCEL_PAYOUT,
        changedBy
      });
    }

    return successPayoutWallet;
  }

  async getWalletTransactionsForAdminPaginated(
    walletId: string,
    page: number = 1,
    limit: number = 15
  ): Promise<PaginationRes<Transaction>> {
    // 1️) Validate wallet
    const wallet = await this.walletsRepository.findOne({ id: walletId });

    if (!wallet) {
      throw new BaseHttpException(ErrorCodeEnum.WALLET_NOT_FOUND);
    }

    if (
      wallet.type !== WalletTypeEnum.PENDING_PAYOUT_WALLET &&
      wallet.type !== WalletTypeEnum.SUCCESS_PAYOUT_WALLET
    ) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_WALLET_TYPE);
    }

    // 2️) Load ALL candidate transactions related to this wallet
    const transactions = await this.transactionRepository.findAll(
      {
        status: TransactionStatusEnum.SUCCESS,
        type: TransactionTypeEnum.PAYOUT,
        totalAmount: { [Op.gt]: 0 }
      },
      [
        {
          model: Wallet,
          through: { attributes: [] },
          where: { id: wallet.id }
        },
        {
          model: TransactionLog,
          as: 'logs'
        }
      ]
    );

    if (!transactions.length) {
      return {
        items: [],
        pageInfo: {
          page,
          limit,
          hasNext: false,
          hasBefore: false,
          totalCount: 0,
          totalPages: 0
        }
      };
    }

    // 3️) Apply business rules filtering
    const validTransactions = transactions.filter(trx =>
      this.isTransactionVisibleForWallet(wallet, trx)
    );

    if (!validTransactions.length) {
      return {
        items: [],
        pageInfo: {
          page,
          limit,
          hasNext: false,
          hasBefore: false,
          totalCount: 0,
          totalPages: 0
        }
      };
    }

    // 4️) Extract unique IDs
    const uniqueTransactionIds = this.getUniqueObjects(
      validTransactions,
      'id'
    ).map(trx => trx.id);

    // 5️) Real pagination on filtered IDs
    return await this.transactionRepository.findPaginated(
      {
        id: { [Op.in]: uniqueTransactionIds }
      },
      [['createdAt', 'DESC']],
      page,
      limit,
      [
        {
          model: User,
          as: 'user'
        }
      ]
    );
  }

  private validatePayoutTransactions({
    wallet,
    transactions,
    allowedLastChanges,
    expectedWalletType
  }: {
    wallet: Wallet;
    transactions: Transaction[];
    allowedLastChanges: TransactionStateChangeEnum[];
    expectedWalletType: WalletTypeEnum;
  }): void {
    // Validate wallet type
    if (wallet.type !== expectedWalletType) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_WALLET_TYPE);
    }

    if (!transactions.length) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_TRANSACTION);
    }

    for (const trx of transactions) {
      // Ensure transaction type
      if (trx.type !== TransactionTypeEnum.PAYOUT) {
        throw new BaseHttpException(ErrorCodeEnum.INVALID_TRANSACTION_TYPE);
      }

      // Ensure transaction belongs to wallet
      const existsInWallet = wallet.transactions?.some(
        wtrx => wtrx.id === trx.id
      );
      if (!existsInWallet) {
        throw new BaseHttpException(ErrorCodeEnum.INVALID_TRANSACTION);
      }

      // Prevent zero or negative amounts
      if (trx.totalAmount <= 0) {
        throw new BaseHttpException(ErrorCodeEnum.INVALID_TRANSACTION_AMOUNT);
      }

      const logs = trx.logs ?? [];
      if (!logs.length) {
        throw new BaseHttpException(ErrorCodeEnum.INVALID_TRANSACTION_STATE);
      }

      // Get last transaction log
      const lastLog = logs.reduce((prev, curr) =>
        prev.createdAt > curr.createdAt ? prev : curr
      );

      // Prevent double processing (idempotency)
      if (!allowedLastChanges.includes(lastLog.change)) {
        throw new BaseHttpException(
          ErrorCodeEnum.INVALID_TRANSACTION_STATE_TRANSITION
        );
      }

      // Prevent mixed owners (lecturer mismatch)
      const hasOwnerShare = trx.revenueShares?.some(
        rs => rs.lecturerId === wallet.ownerId
      );
      if (!hasOwnerShare) {
        throw new BaseHttpException(ErrorCodeEnum.INVALID_TRANSACTION_OWNER);
      }
    }
  }

  private isTransactionVisibleForWallet(
    wallet: Wallet,
    transaction: Transaction
  ): boolean {
    const logs = transaction.logs ?? [];
    if (!logs.length) return false;

    const lastLog = logs.reduce((prev, curr) =>
      prev.createdAt > curr.createdAt ? prev : curr
    );

    switch (wallet.type) {
      case WalletTypeEnum.PENDING_PAYOUT_WALLET:
        return [
          TransactionStateChangeEnum.TRANSACTION_FULFILLED,
          TransactionStateChangeEnum.CANCEL_PAYOUT,
          TransactionStateChangeEnum.REFUND_USER
        ].includes(lastLog.change);

      case WalletTypeEnum.SUCCESS_PAYOUT_WALLET:
        return lastLog.change === TransactionStateChangeEnum.CONFIRM_PAYOUT;

      default:
        return false;
    }
  }

  private async calculateTotalAmount(
    transactions: Transaction[],
    wallet: Wallet
  ): Promise<number> {
    let total = 0;
    for (const trx of transactions) {
      total += await this.calculateBalanceChangeAmount(trx, wallet);
    }
    return total;
  }

  // -----------

  private async updateWalletStateOnTransactionState(
    transaction: Transaction,
    wallet: Wallet
  ): Promise<Wallet> {
    switch (transaction.status) {
      case TransactionStatusEnum.SUCCESS:
        return await this.updateWalletStateOnSuccessTransaction(
          transaction,
          wallet
        );
      case TransactionStatusEnum.CANCELED:
        return await this.updateWalletStateOnCanceledOrRefundedTransaction(
          transaction,
          wallet
        );
      case TransactionStatusEnum.REFUNDED:
        return await this.updateWalletStateOnCanceledOrRefundedTransaction(
          transaction,
          wallet
        );
      default:
        throw new BaseHttpException(
          ErrorCodeEnum.GENERAL_INVALID_TRANSACTION_STATUS
        );
    }
  }

  private async updateWalletStateOnSuccessTransaction(
    transaction: Transaction,
    wallet: Wallet
  ): Promise<Wallet> {
    const walletOwnerRevenueShare = await this.calculateBalanceChangeAmount(
      transaction,
      wallet
    );

    wallet.balance += walletOwnerRevenueShare;
    wallet.transactions.push(transaction);
    await wallet.save();
    return wallet;
  }

  private async updateWalletStateOnCanceledOrRefundedTransaction(
    transaction: Transaction,
    wallet: Wallet
  ): Promise<Wallet> {
    const deductedAmount = await this.calculateBalanceChangeAmount(
      transaction,
      wallet
    );
    wallet.balance -= deductedAmount;
    wallet.transactions.push(transaction);
    await wallet.save();
    return wallet;
  }

  private async updateStripeWalletBalanceOnCancelOrRefund(
    transaction: Transaction
  ): Promise<void> {
    const stripeWallet = await this.walletsRepository.findOrCreate(
      {
        type: WalletTypeEnum.STRIP_WALLET
      },
      {
        ownerType: WalletOwnerTypeEnum.SYSTEM,
        type: WalletTypeEnum.STRIP_WALLET,
        status: WalletStatusEnum.ACTIVE,
        balance: 0
      }
    );
    stripeWallet.balance += transaction.totalAmount;
    await stripeWallet.save();
  }

  async calculateBalanceChangeAmount(
    transaction: Transaction,
    wallet: Wallet
  ): Promise<number> {
    let amount = 0;
    switch (wallet.type) {
      case WalletTypeEnum.SYS_WALLET:
        amount = transaction.revenueShares.reduce(
          (acc, revenueShare) => acc + revenueShare.systemShare,
          0
        );
        break;
      case WalletTypeEnum.VAT_WALLET:
        amount = transaction.revenueShares.reduce(
          (acc, revenueShare) => acc + revenueShare.vatAmount,
          0
        );
        break;
      case WalletTypeEnum.PAYMENT_GATEWAY_VAT_WALLET:
        amount = transaction.revenueShares.reduce(
          (acc, revenueShare) => acc + revenueShare.paymentGateWayVatAmount,
          0
        );
        break;
      case WalletTypeEnum.LECTURER_WALLET:
        amount = transaction.revenueShares
          .filter(revenueShare => revenueShare.lecturerId === wallet.ownerId)
          .reduce((acc, revenueShare) => acc + revenueShare.lecturerShare, 0);
        break;
      case WalletTypeEnum.PENDING_LECTURER_WALLET:
        amount = transaction.revenueShares
          .filter(revenueShare => revenueShare.lecturerId === wallet.ownerId)
          .reduce((acc, revenueShare) => acc + revenueShare.lecturerShare, 0);
        break;
      case WalletTypeEnum.PENDING_PAYOUT_WALLET:
        amount = transaction.revenueShares
          .filter(revenueShare => revenueShare.lecturerId === wallet.ownerId)
          .reduce((acc, revenueShare) => acc + revenueShare.lecturerShare, 0);
        break;
      case WalletTypeEnum.SUCCESS_PAYOUT_WALLET:
        amount = transaction.revenueShares
          .filter(revenueShare => revenueShare.lecturerId === wallet.ownerId)
          .reduce((acc, revenueShare) => acc + revenueShare.lecturerShare, 0);
        break;
    }
    return amount;
  }

  private async addTransactionToWallet(
    transaction: Transaction,
    wallet: Wallet
  ): Promise<void> {
    await this.mutateTransactionTypeBaseOnWallet(transaction, wallet);
    try {
      await this.walletTransactionRepo.findOrCreate(
        { transactionId: transaction.id, walletId: wallet.id },
        {
          transactionId: transaction.id,
          walletId: wallet.id
        }
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async addTransactionsToWallet(
    transactions: Transaction[],
    wallet: Wallet
  ): Promise<void> {
    for (const transaction of transactions) {
      await this.addTransactionToWallet(transaction, wallet);
    }
  }

  private async mutateTransactionTypeBaseOnWallet(
    transaction: Transaction,
    wallet: Wallet
  ): Promise<void> {
    switch (wallet.type) {
      case WalletTypeEnum.SYS_WALLET:
        transaction.type = TransactionTypeEnum.PAYMENT;
        break;
      case WalletTypeEnum.VAT_WALLET:
        transaction.type = TransactionTypeEnum.PAYMENT;
        break;
      case WalletTypeEnum.PAYMENT_GATEWAY_VAT_WALLET:
        transaction.type = TransactionTypeEnum.PAYMENT;
        break;
      case WalletTypeEnum.PENDING_LECTURER_WALLET:
        transaction.type = TransactionTypeEnum.PAYMENT;
        break;
      case WalletTypeEnum.LECTURER_WALLET:
        transaction.type = TransactionTypeEnum.PAYMENT;
        break;
      case WalletTypeEnum.PENDING_PAYOUT_WALLET:
        transaction.type = TransactionTypeEnum.PAYOUT;
        break;
      case WalletTypeEnum.SUCCESS_PAYOUT_WALLET:
        transaction.type = TransactionTypeEnum.PAYOUT;
        break;
      case WalletTypeEnum.STRIP_WALLET:
        transaction.type = TransactionTypeEnum.REFUND;
        break;
      default:
        throw new BaseHttpException(ErrorCodeEnum.INVALID_WALLET_TYPE);
    }
    await transaction.save();
  }

  getPayoutWalletSuccessEvent(walletId: string): PayoutWalletSuccessEvent {
    const event = new PayoutWalletSuccessEvent();
    event.walletId = walletId;
    return event;
  }

  getUniqueObjects(array: any[], uniqueKey: string): any[] {
    return array.filter(
      (item, index, self) =>
        index === self.findIndex(t => t[uniqueKey] === item[uniqueKey])
    );
  }
}
