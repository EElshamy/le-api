import { NestDataLoader } from '../../_common/types/loader.interface';
import { User } from '../models/user.model';
import * as DataLoader from 'dataloader';
import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { Op } from 'sequelize';

@Injectable()
export class UserLoaders implements NestDataLoader {
  constructor(
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>
  ) {}
  generateDataLoader(): DataLoader<any, any> {
    return new DataLoader(
      async (userIds: string[]) => await this.findUserByIds(userIds)
    );
  }

  async findUserByIds(usersIds: string[]) {
    const users = await this.userRepo.findAll({
      id: { [Op.in]: usersIds }
    });

    const userMap = users.reduce((map, user) => {
      map.set(
        user.id,
        user.isDeleted ? { ...user, enFullName: 'Deleted Account' } : user
      );
      return map;
    }, new Map<string, Partial<User>>());

    return usersIds.map(id => userMap.get(id) || null);
  }
}
