import { Inject } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { NestDataLoader } from '@src/_common/types/loader.interface';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';
import { Transaction } from '../models/transaction.model';
import { Op } from 'sequelize';

export class TransactionsUserLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.TransactionsRepository)
    private readonly transactionsRepository: IRepository<Transaction>
  ) {}

  generateDataLoader(): DataLoader<string, User> {
    return new DataLoader(async (transactionsIds: string[]) => {
      return this.loadUsersForTransactions(transactionsIds);
    });
  }

  private async loadUsersForTransactions(transactionsIds: string[]): Promise<User[]> {
    // Fetch transactions with their users
    const transactions = await this.transactionsRepository.findAll(
      { id: { [Op.in]: transactionsIds } },
      [
        {
          model: User,
          as: 'user'
        }
      ]
    );

    // Map the users back to the order of transactionsIds
    const users = transactionsIds.map(id => {
      const transaction = transactions.find(t => t.id === id);
      return transaction?.user || null;
    });

    return users;
  }
}
