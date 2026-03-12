import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { UserRoleEnum } from '@src/user/user.enum';
import { Transactional } from 'sequelize-transactional-typescript';
import {
  TransactionLogsFilterArgs,
  TransactionLogsSortArgs
} from '../inputs/transaction-log.inputs';
import {
  GqlTransactionLogResponse,
  GqlTransactionLogsPaginatedResponse
} from '../interfaces/transaction-logs.interfaces';
import { TransactionLog } from '../models/transaction-logs.model';
import { Transaction } from '../models/transaction.model';
import { TransactionLogService } from '../services/transaction-logs.service';
import { TransactionService } from '../services/transaction.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@src/auth/auth.guard';

@Resolver(() => TransactionLog)
export class TransactionLogResolver {
  constructor(
    private readonly transactionLogService: TransactionLogService,
    private readonly transactionService: TransactionService
  ) {}

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Transactional()
  @Query(() => GqlTransactionLogsPaginatedResponse)
  async getTransactionLogs(
    @Args() filter: TransactionLogsFilterArgs,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: TransactionLogsSortArgs
  ): Promise<PaginationRes<TransactionLog>> {
    return await this.transactionLogService.getTransactionLogs(
      filter.filter,
      paginate.paginate,
      sort.sort
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Query(() => GqlTransactionLogResponse)
  @Transactional()
  async getTransactionLog(@Args('id') id: string): Promise<TransactionLog> {
    return await this.transactionLogService.getTransactionLog(id);
  }

  //(mark it as deleted)[soft delete]
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlTransactionLogResponse)
  @Transactional()
  async deleteTransactionLog(@Args('id') id: string): Promise<TransactionLog> {
    return await this.transactionLogService.deleteTransactionLog(id);
  }

  @ResolveField(() => Transaction)
  async transaction(
    @Parent() transactionLog: TransactionLog
  ): Promise<Transaction> {
    return await this.transactionService.getTransactionById(
      transactionLog.transactionId
    );
  }
}
