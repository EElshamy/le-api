import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { User } from '@src/user/models/user.model';
import { UserRoleEnum } from '@src/user/user.enum';
import { Transactional } from 'sequelize-transactional-typescript';
import { WalletOwnerTypeEnum, WalletStatusEnum } from '../enums/wallets.enums';
import {
  LecturersWalletsFilterArg,
  PayoutWalletsFilterArg,
  WalletsFilterArg,
  WalletSortArg
} from '../inputs/wallet.inputs';
import { TransactionPreview } from '../interfaces/transaction-preview.interface';
import {
  AllWalletsBalanceCombined,
  WalletData
} from '../interfaces/wallet-data.object';
import {
  GqlAllWalletsBalanceCombined,
  GqlWalletDataResponse,
  GqlWalletResponse,
  GqlWalletsPaginatedResponse
} from '../interfaces/wallet-responses.interface';
import { Wallet } from '../models/wallet.model';
import { WalletService } from '../services/wallet.service';
import { AuthGuard } from '@src/auth/auth.guard';
import { PayoutPermissionsEnum } from '@src/security-group/security-group-permissions';
import { GqlTransactionsPaginatedResponse } from '../interfaces/transaction-responses.interface';
import { Transaction } from '../models/transaction.model';
import { WalletsCron } from '../jobs/wallet.crons';
import { GqlBooleanResponse } from '@src/_common/graphql/graphql-response.type';

@Resolver(() => Wallet)
export class WalletResolver {
  constructor(
    private readonly walletService: WalletService,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    private readonly walletsCron: WalletsCron
  ) {}

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlWalletsPaginatedResponse)
  @Transactional()
  async getWallets(
    @Args() filter: WalletsFilterArg,
    @Args() sort: WalletSortArg,
    @Args() paginator: NullablePaginatorInput
  ): Promise<PaginationRes<Wallet>> {
    return await this.walletService.getWallets(
      filter?.filter,
      sort?.sort,
      paginator?.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlAllWalletsBalanceCombined)
  @Transactional()
  async getAllWalletsBalanceCompined(): Promise<AllWalletsBalanceCombined> {
    return await this.walletService.getAllWalletsBalanceCompined();
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(PayoutPermissionsEnum.READ_PAYOUTS)
  @Query(() => GqlWalletsPaginatedResponse)
  @Transactional()
  async getPayoutWallets(
    @Args() filter: PayoutWalletsFilterArg,
    @Args() sort: WalletSortArg,
    @Args() paginator: NullablePaginatorInput
  ): Promise<PaginationRes<Wallet>> {
    return await this.walletService.getPayoutWallets(
      filter?.filter,
      sort?.sort,
      paginator?.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER)
  @Query(() => GqlWalletsPaginatedResponse)
  @Transactional()
  async getMyPayoutWalletsForLecturer(
    @Args() filter: PayoutWalletsFilterArg,
    @Args() sort: WalletSortArg,
    @Args() paginator: NullablePaginatorInput,
    @CurrentUser() user: User
  ): Promise<PaginationRes<Wallet>> {
    return await this.walletService.getMyPayoutWalletsForLecturer(
      filter?.filter,
      sort?.sort,
      paginator?.paginate,
      user
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlWalletsPaginatedResponse)
  @Transactional()
  async getLecturersWallets(
    @Args() filter: LecturersWalletsFilterArg,
    @Args() sort: WalletSortArg,
    @Args() paginator: NullablePaginatorInput
  ): Promise<PaginationRes<Wallet>> {
    return await this.walletService.getLecturersWallets(
      filter?.filter,
      sort?.sort,
      paginator?.paginate
    );
  }
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Query(() => GqlWalletResponse)
  @Transactional()
  async getWallet(@Args('id') id: string): Promise<Wallet> {
    return await this.walletService.getWallet(id);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER)
  @Query(() => GqlWalletResponse)
  @Transactional()
  async getMyWallet(@CurrentUser() currentUser: User): Promise<Wallet> {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.walletService.getMyWallet(currentUser);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.LECTURER)
  @Query(() => GqlWalletDataResponse)
  async getLectureWalletsData(
    @CurrentUser() currentUser: User
  ): Promise<WalletData> {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }
    return await this.walletService.getLectureWalletsData(currentUser);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(() => GqlWalletDataResponse)
  async getLecturerWalletsDataByAdmin(
    @Args('lecturerId') lecturerId: string
  ): Promise<WalletData> {
    if (!lecturerId) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    return this.walletService.getLecturerWalletsDataByAdmin(lecturerId);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlWalletResponse)
  @Transactional()
  async suspendWallet(@Args('walletId') walletId: string): Promise<Wallet> {
    return await this.walletService.updateWalletStatus(
      walletId,
      WalletStatusEnum.SUSPENDED
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlWalletResponse)
  @Transactional()
  async activateWallet(@Args('walletId') walletId: string): Promise<Wallet> {
    return await this.walletService.updateWalletStatus(
      walletId,
      WalletStatusEnum.ACTIVE
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlWalletResponse)
  @Transactional()
  async inactivateWallet(@Args('walletId') walletId: string): Promise<Wallet> {
    return await this.walletService.updateWalletStatus(
      walletId,
      WalletStatusEnum.INACTIVE
    );
  }

  //(soft delete)
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlWalletResponse)
  @Transactional()
  async deleteWallet(@Args('walletId') walletId: string): Promise<Wallet> {
    return await this.walletService.deleteWallet(walletId);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(PayoutPermissionsEnum.UPDATE_PAYOUTS)
  // @Mutation(() => GqlWalletResponse)
  @Transactional()
  async confirmPendingPayout(
    @Args('id') pendingPayoutWalletId: string,
    @CurrentUser() currentUser: User
  ): Promise<Wallet> {
    return await this.walletService.updatePayoutWalletState(
      pendingPayoutWalletId,
      'success',
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(PayoutPermissionsEnum.UPDATE_PAYOUTS)
  // @Mutation(() => GqlWalletResponse)
  @Transactional()
  async cancelPendingPayout(
    @Args('id') pendingPayoutWalletId: string,
    @CurrentUser() currentUser: User
  ): Promise<Wallet> {
    return await this.walletService.updatePayoutWalletState(
      pendingPayoutWalletId,
      'canceled',
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(PayoutPermissionsEnum.UPDATE_PAYOUTS)
  // @Mutation(() => GqlWalletResponse)
  @Transactional()
  async cancelSuccessfulPayout(
    @Args('id') successfulPayoutWalletId: string,
    @CurrentUser() currentUser: User
  ): Promise<Wallet> {
    return await this.walletService.updatePayoutWalletState(
      successfulPayoutWalletId,
      'canceled',
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(PayoutPermissionsEnum.UPDATE_PAYOUTS)
  @Mutation(() => GqlWalletResponse, {
    description:
      'Transfer transactions from PENDING_PAYOUT_WALLET -> SUCCESS_PAYOUT_WALLET '
  })
  @Transactional()
  async confirmPendingPayoutByTransactions(
    @Args('walletId') walletId: string,
    @Args({ name: 'transactionIds', type: () => [String] })
    transactionIds: string[],
    @CurrentUser() currentUser: User
  ): Promise<Wallet> {
    return await this.walletService.updatePayoutWalletStateByTransactions(
      walletId,
      transactionIds,
      'success',
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(PayoutPermissionsEnum.UPDATE_PAYOUTS)
  @Mutation(() => GqlWalletResponse, {
    description:
      'Transfer transactions from PENDING_PAYOUT_WALLET -> LECTURER_WALLET '
  })
  @Transactional()
  async cancelPendingPayoutByTransactions(
    @Args('walletId') walletId: string,
    @Args({ name: 'transactionIds', type: () => [String] })
    transactionIds: string[],
    @CurrentUser() currentUser: User
  ): Promise<Wallet> {
    return await this.walletService.updatePayoutWalletStateByTransactions(
      walletId,
      transactionIds,
      'canceled',
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(PayoutPermissionsEnum.UPDATE_PAYOUTS)
  @Mutation(() => GqlWalletResponse, {
    description:
      'Transfer transactions from SUCCESS_PAYOUT_WALLET -> PENDING_PAYOUT_WALLET '
  })
  @Transactional()
  async cancelSuccessfulPayoutByTransactions(
    @Args('walletId') walletId: string,
    @Args({ name: 'transactionIds', type: () => [String] })
    transactionIds: string[],
    @CurrentUser() currentUser: User
  ): Promise<Wallet> {
    return await this.walletService.updatePayoutWalletStateByTransactions(
      walletId,
      transactionIds,
      'canceled',
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(PayoutPermissionsEnum.UPDATE_PAYOUTS)
  @Query(() => GqlTransactionsPaginatedResponse)
  async walletTransactionsForAdmin(
    @Args('walletId') walletId: string,
    @Args() paginate: NullablePaginatorInput
  ): Promise<PaginationRes<Transaction>> {
    return this.walletService.getWalletTransactionsForAdminPaginated(
      walletId,
      paginate?.paginate?.page,
      paginate?.paginate?.limit
    );
  }

  @Mutation(() => GqlBooleanResponse)
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  async runPendingLecturerWalletsJob(): Promise<boolean> {
    await this.walletsCron.handleInstructorWalletsCron();
    return true;
  } 

  @Mutation(() => GqlBooleanResponse)
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  async runPendingPayoutWalletsJob(): Promise<boolean> {
    await this.walletsCron.handlePendingPayoutWalletsCron();
    return true;
  }

  @ResolveField(() => TransactionPreview)
  async transaction(@Parent() wallet: Wallet): Promise<TransactionPreview> {
    return await this.walletService.getWalletTransaction(wallet);
  }

  @ResolveField(() => Lecturer, { nullable: true })
  async owner(@Parent() wallet: Wallet): Promise<Lecturer> {
    return wallet.ownerType === WalletOwnerTypeEnum.LECTURER ?
        await this.lecturerRepo.findOne({ id: wallet.ownerId }, ['user'])
      : null;
  }
}
