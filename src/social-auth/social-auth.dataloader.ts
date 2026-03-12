import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import * as DataLoader from 'dataloader';
import { IDataLoaderService } from '../_common/dataloader/dataloader.interface';
import { UserSocialAccountsLoaderType } from '../_common/dataloader/dataloader.type';
import { UserSocialAccount } from './user-social-account.model';

@Injectable()
export class SocialAuthDataloader implements IDataLoaderService {
  constructor(
    @Inject(Repositories.UserSocialAccountsRepository)
    private readonly socialAccountRepo: IRepository<UserSocialAccount>
  ) {}

  public createLoaders() {
    return {
      userSocialAccountsLoader: <UserSocialAccountsLoaderType>(
        new DataLoader(
          async (usersIds: string[]) => await this.userSocialAccounts(usersIds)
        )
      )
    };
  }
  async userSocialAccounts(usersIds: string[]) {
    const usersSocialAccountsMap: Map<string, UserSocialAccount[]> = new Map();
    const socialAccounts = await this.socialAccountRepo.findAll({
      userId: usersIds
    });
    socialAccounts.forEach(socialAccount => {
      if (!usersSocialAccountsMap.has(socialAccount.userId)) {
        usersSocialAccountsMap.set(socialAccount.userId, []);
      }
      usersSocialAccountsMap.get(socialAccount.userId).push(socialAccount);
    });

    return usersIds.map(userId => usersSocialAccountsMap.get(userId));
  }
}
