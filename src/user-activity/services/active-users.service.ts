import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { ActiveUsersHistory } from '../models/active-users-history.model';
import { User } from '../../user/models/user.model';

@Injectable()
export class ActiveUsersHistoryService {
  constructor(
    @Inject(Repositories.ActiveUsersHistoriesRepository)
    private readonly activeUsersRepo: IRepository<ActiveUsersHistory>
  ) {}
  async markUserAsActiveForToday(currentUser: User) {
    try {
      const todayDate = new Date().setUTCHours(0, 0, 0, 0);
      const lastActiveAt = new Date(currentUser.lastActiveAt).setUTCHours(0, 0, 0, 0);

      if (todayDate === lastActiveAt) return null;

      await this.activeUsersRepo.createOne({ userId: currentUser.id, activeAt: todayDate });
      return todayDate;
    } catch (err) {
      console.log('active users error', err.name);
      return null;
    }
  }
}
