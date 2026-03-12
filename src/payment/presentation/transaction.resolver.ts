import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { GqlStringResponse } from '@src/_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { User } from '@src/user/models/user.model';
import { UserRoleEnum } from '@src/user/user.enum';
import { Op } from 'sequelize';
import { Transactional } from 'sequelize-transactional-typescript';
import {
  TransactionInvoiceDownloadInput,
  TransactionsFilterForAdminArg,
  TransactionsFilterForLecturerArg,
  TransactionsFilterForUserArg,
  TransactionSortArg,
  UpdateTransactionStatusInput
} from '../inputs/transaction.inputs';
import { GqlInvoiceResponse, Invoice } from '../interfaces/invoice-response';
import {
  GqlTransactionStatusChangeResponse,
  TransactionStatusChangeResponse
} from '../interfaces/payment-responses.interfaces';
import {
  TransactionPurchaseForAdmin,
  TransactionPurchaseForLecturer,
  TransactionRevenueForAdmin,
  TransactionRevenueForLecturer
} from '../interfaces/transaction-preview.interface';
import {
  GqlTransactionResponse,
  GqlTransactionsPaginatedResponse
} from '../interfaces/transaction-responses.interface';
import { Transaction } from '../models/transaction.model';
import { PaymentService } from '../services/payment.service';
import { RevenueShareService } from '../services/revenue.service';
import { TransactionService } from '../services/transaction.service';
import { AuthGuard } from '@src/auth/auth.guard';
import { GqlTransactionDetailsResponse } from '../interfaces/transaction-details.response';
import { Loader } from '@src/_common/decorators/loader.decorator';
import { TransactionsProgramsTypesLoader } from '../loaders/transaction-programs-types.loader';
import DataLoader from 'dataloader';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { TransactionPermissionsEnum } from '@src/security-group/security-group-permissions';
import { WalletService } from '../services/wallet.service';
import { Wallet } from '../models/wallet.model';
import { LearningProgramRevenueShare } from '../models/revenue-share.model';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { TransactionsUserLoader } from '../loaders/transaction-user.loader';
import { TransactionsLecturersLoader } from '../loaders/transaction-lecturers.loader';

@Resolver(() => Transaction)
export class TransactionResolver {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly transactionService: TransactionService,
    private readonly revenueShareService: RevenueShareService,
    private readonly walletService: WalletService,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepository: IRepository<Lecturer>,
    @Inject(Repositories.WalletsRepository)
    private readonly walletRepository: IRepository<Wallet>,
    @Inject(Repositories.TransactionsRepository)
    private readonly transactionRepository: IRepository<Transaction>
  ) {}

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(TransactionPermissionsEnum.READ_TRANSACTIONS)
  @Query(() => GqlTransactionsPaginatedResponse)
  @Transactional()
  async getTransactions(
    @Args() filter: TransactionsFilterForAdminArg,
    @Args() sort: TransactionSortArg,
    @Args() paginate: NullablePaginatorInput,
    @Args('lecturerIdForRevenueShare', { type: () => String, nullable: true })
    lecturerId: string
  ): Promise<PaginationRes<Transaction>> {
    return await this.transactionService.getTransactions(
      filter?.filter,
      sort?.sort,
      paginate?.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(TransactionPermissionsEnum.EXPORT_CSV_TRANSACTIONS)
  @Mutation(() => GqlStringResponse)
  async exportTransactions(
    @Args('id', { type: () => String, nullable: true }) id: string
  ): Promise<string> {
    return await this.transactionService.exportTransactions(id);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(TransactionPermissionsEnum.EXPORT_CSV_TRANSACTIONS)
  @Mutation(() => GqlStringResponse)
  async exportPayoutTransactions(): Promise<string> {
    return await this.transactionService.exportPayoutTransactions();
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER)
  @Query(() => GqlTransactionsPaginatedResponse)
  @Transactional()
  async getMyTransactionsForLecturer(
    @Args() filter: TransactionsFilterForLecturerArg,
    @Args() sort: TransactionSortArg,
    @Args() paginate: NullablePaginatorInput,
    @CurrentUser() user: User
  ): Promise<PaginationRes<Transaction>> {
    return await this.transactionService.getTransactionsForLecturer(
      filter?.filter,
      sort?.sort,
      paginate?.paginate,
      user
    );
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlTransactionsPaginatedResponse)
  @Transactional()
  async getMyTransactionsForUser(
    @Args() filter: TransactionsFilterForUserArg,
    @Args() sort: TransactionSortArg,
    @Args() paginate: NullablePaginatorInput,
    @CurrentUser() user: User
  ): Promise<PaginationRes<Transaction>> {
    return await this.transactionService.getTransactionsForUser(
      filter?.filter,
      sort?.sort,
      paginate?.paginate,
      user
    );
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlTransactionResponse)
  @Transactional()
  async getTransaction(
    @Args('transactionId') transactionId: string
  ): Promise<Transaction> {
    return await this.transactionService.getTransactionById(transactionId);
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlTransactionResponse)
  @Transactional()
  async getTransactionByCode(@Args('code') code: string): Promise<Transaction> {
    return await this.transactionService.getTransactionByCode(code);
  }

  // (mark it as deleted)[soft delete]
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(TransactionPermissionsEnum.DELETE_TRANSACTIONS)
  @Mutation(() => GqlTransactionResponse)
  @Transactional()
  async deleteTransaction(
    @Args('transactionId') transactionId: string
  ): Promise<Transaction> {
    return await this.transactionService.deleteTransaction(transactionId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlStringResponse)
  @Transactional()
  async downloadInvoice(
    @Args('input') input: TransactionInvoiceDownloadInput
  ): Promise<string> {
    return this.transactionService.generateInvoiceDownloadLink(
      input.transactionId,
      input.lang
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(TransactionPermissionsEnum.UPDATE_TRANSACTIONS)
  @Mutation(() => GqlTransactionStatusChangeResponse)
  @Transactional()
  async updateTransactionStatus(
    @Args('input') input: UpdateTransactionStatusInput,
    @CurrentUser() user: User
  ): Promise<TransactionStatusChangeResponse> {
    return this.paymentService.updateTransactionStatus(
      input.transactionId,
      input.status,
      user
    );
  }

  @ResolveField(() => User, { nullable: true })
  async user(
    @Parent() transaction: Transaction,
    @Loader(TransactionsUserLoader)
    transactionsUserLoader: DataLoader<string, User>
  ) {
    if (transaction?.user) {
      return transaction.user;
    }
    return transactionsUserLoader.load(transaction.id);
  }

  @ResolveField(() => [Lecturer])
  async to(
    @Parent() transaction: Transaction,
    @Loader(TransactionsLecturersLoader) loader: DataLoader<string, Lecturer[]>
  ): Promise<Lecturer[]> {
    return loader.load(transaction.purchaseId);
  }

  @ResolveField(() => TransactionRevenueForAdmin)
  async revenueShareForAdmin(
    @Parent() transaction: Transaction
  ): Promise<TransactionRevenueForAdmin> {
    return await this.revenueShareService.getTransactionRevenueForAdmin(
      transaction
    );
  }

  @ResolveField(() => TransactionRevenueForLecturer, { nullable: true })
  async revenueShareForLecturer(
    @Parent() transaction: Transaction,
    @CurrentUser() user: User,
    @Args('lecturerId', { type: () => ID, nullable: true }) lecturerId: string
  ): Promise<TransactionRevenueForLecturer> {
    let userId = user?.id;
    if (!user && lecturerId) {
      userId = (
        await this.lecturerRepository.findOne({
          id: lecturerId
        })
      ).userId;
    }

    return userId ?
        await this.revenueShareService.getTransactionRevenueForLecturer(
          transaction,
          userId
        )
      : null;
  }

  @ResolveField(() => TransactionPurchaseForAdmin)
  async purchaseForAdmin(
    @Parent() transaction: Transaction
  ): Promise<TransactionPurchaseForAdmin> {
    return await this.revenueShareService.getTransactionPurchaseForAdmin(
      transaction
    );
  }

  @ResolveField(() => TransactionPurchaseForLecturer, { nullable: true })
  async purchaseForLecturer(
    @Parent() transaction: Transaction,
    @CurrentUser() user: User
  ): Promise<TransactionPurchaseForLecturer> {
    if (!user) {
      return null;
    }

    const purchaseForLecturer =
      await this.revenueShareService.getTransactionPurchaseForLecturer(
        transaction,
        user.id
      );

    if (!purchaseForLecturer) {
      return null;
    }

    return purchaseForLecturer;
  }

  @Query(() => GqlInvoiceResponse)
  async getInvoiceByTransactionId(
    @Args('id') transactionId: string
  ): Promise<Invoice> {
    return await this.transactionService.getInvoiceByTransactionId(
      transactionId
    );
  }

  @ResolveField(() => [LearningProgramTypeEnum], { nullable: true })
  async programsTypes(
    @Parent() transaction: Transaction,
    @Loader(TransactionsProgramsTypesLoader)
    transactionsProgramsTypesLoader: DataLoader<any, any>
  ) {
    return transactionsProgramsTypesLoader.load(transaction.id);
  }

  @Query(() => GqlTransactionDetailsResponse, { nullable: true })
  async transactionDetails(@Args('transactionId') transactionId: string) {
    return await this.transactionService.getTransactionDetails(transactionId);
  }

  @ResolveField(() => MoneyScalar, { nullable: true })
  async walletAmount(
    @Parent() transaction: Transaction,
    @Args('walletId') walletId: string
  ): Promise<number> {
    const transactionWithRevenue = await this.transactionRepository.findOne(
      {
        id: transaction.id
      },
      [
        {
          model: LearningProgramRevenueShare
        }
      ]
    );
    const wallet = await this.walletRepository.findOne({
      id: walletId
    });
    if (!wallet) return null;

    return await this.walletService.calculateBalanceChangeAmount(
      transactionWithRevenue,
      wallet
    );
  }
}
