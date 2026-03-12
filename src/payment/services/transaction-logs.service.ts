import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { User } from '@src/user/models/user.model';
import { Op, Sequelize } from 'sequelize';
import {
  TransactionStateChangeEnum,
  TransactionStatusEnum
} from '../enums/transaction-status.enum';
import {
  TransactionLogsFilterInput,
  TransactionLogSortInput
} from '../inputs/transaction-log.inputs';
import { TransactionLog } from '../models/transaction-logs.model';
import { Transaction } from '../models/transaction.model';

@Injectable()
export class TransactionLogService {
  constructor(
    @Inject(Repositories.TransactionLogsRepository)
    private readonly transactionLogsRepository: IRepository<TransactionLog>
  ) {}

  async getTransactionLogs(
    filter: TransactionLogsFilterInput,
    paginate: PaginatorInput,
    sort: TransactionLogSortInput
  ): Promise<PaginationRes<TransactionLog>> {
    return await this.transactionLogsRepository.findPaginated(
      {
        ...(filter?.searchKey && {
          change: { [Op.iLike]: `%${filter?.searchKey}%` }
        }),
        ...(filter?.transactionId && {
          transactionId: filter?.transactionId
        }),
        ...(filter?.status && { status: filter?.status }),
        ...(filter?.change && { change: filter?.change })
      },
      [[Sequelize.col('createdAt'), sort?.sortType || SortTypeEnum.DESC]],
      paginate?.page || 1,
      paginate?.limit || 15,
      [
        {
          model: User,
          required: true,
          as: 'user'
        },
        {
          model: Transaction,
          required: true,
          order: [
            [
              Sequelize.col(sort?.sortBy || 'createdAt'),
              sort?.sortType || SortTypeEnum.DESC
            ]
          ]
        }
      ]
    );
  }

  async getTransactionLog(id: string): Promise<TransactionLog> {
    const transactionLog = await this.transactionLogsRepository.findOne({
      id
    });

    if (!transactionLog)
      throw new BaseHttpException(ErrorCodeEnum.TRANSACTION_LOG_NOT_FOUND);
    return transactionLog;
  }

  async deleteTransactionLog(id: string): Promise<TransactionLog> {
    const transactionLog = await this.transactionLogsRepository.findOne({
      id
    });

    if (!transactionLog)
      throw new BaseHttpException(ErrorCodeEnum.TRANSACTION_LOG_NOT_FOUND);

    return await this.transactionLogsRepository.updateOneFromExistingModel(
      transactionLog,
      { deletedAt: new Date() }
    );
  }

  async createTransactionLog(input: {
    transaction: Transaction;
    changedBy: User;
    status: TransactionStatusEnum;
    change: TransactionStateChangeEnum;
  }): Promise<TransactionLog> {
    const { transaction, changedBy, status, change } = input;
    return await this.transactionLogsRepository.createOne({
      transactionId: transaction.id,
      transaction,
      userId: changedBy?.id,
      user: changedBy,
      status,
      change
    });
  }
}
