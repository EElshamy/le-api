import { Inject } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { NestDataLoader } from '@src/_common/types/loader.interface';
import { Category } from '@src/course-specs/category/category.model';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';
import { Transaction } from '../models/transaction.model';
import { Op } from 'sequelize';
import { Purchase } from '@src/cart/models/purchase.model';
import { PurchaseItem } from '@src/cart/models/purchase-item.model';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { dir } from 'console';

export class TransactionsProgramsTypesLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.TransactionsRepository)
    private readonly transactionsRepository: IRepository<Transaction>
  ) {}
  generateDataLoader(currentUser?: User): DataLoader<any, any> {
    return new DataLoader(async (transactionsIds: string[]) => {
      return this.trasactionsProgramsTypes(transactionsIds);
    });
  }

  async trasactionsProgramsTypes(
    transactionsIds: string[]
  ): Promise<LearningProgramTypeEnum[]> {
    // console.log('debugging_______ trasactionsProgramsTypes', '______');
    const transactions = await this.transactionsRepository.findAll(
      {
        id: { [Op.in]: transactionsIds }
      },
      [
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
      ]
    );

    const res = transactionsIds.map(transactionId =>
      transactions
        .filter(transaction => transaction.id === transactionId)
        .map(transaction =>
          transaction.purchase?.purchaseItems.map(
            purchaseItem => purchaseItem.type
          )
        )
    ) as unknown as LearningProgramTypeEnum[];

    // console.log('res', res.flat());

    return res.flat();
  }
}
