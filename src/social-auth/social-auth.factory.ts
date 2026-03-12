import { faker } from '@faker-js/faker';
import { buildRepository } from '../_common/database/database-repository.builder';
import { IRepository } from '../_common/database/repository.interface';
import { User } from '../user/models/user.model';
import { SocialProvidersEnum } from './social-auth.enum';
import { UserSocialAccount } from './user-social-account.model';
import { sign } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

const config = new ConfigService();

const userSocialAccountRepo = new (buildRepository(
  UserSocialAccount
))() as IRepository<UserSocialAccount>;

export type UserSocialAccountType = {
  id?: string;
  userId: string;
  providerId: string;
  provider: SocialProvidersEnum;
  authToken?: string;
};

function buildParams(input: Partial<UserSocialAccountType> = {}): UserSocialAccountType {
  return {
    providerId: input.providerId ?? (Math.random() * 10000).toString(),
    provider:
      input.provider ?? (faker.helpers.arrayElement(Object.keys(SocialProvidersEnum)) as any),
    userId: input.userId,
    authToken: sign({ userId: 'userId' }, config.get('JWT_SECRET'))
  };
}

export const UserSocialAccountFactory = async (
  user: User,
  input: Partial<UserSocialAccountType> = {},
  returnParamsOnly: boolean = false
): Promise<UserSocialAccount | UserSocialAccountType> => {
  const params = buildParams({ ...input, userId: user.id });
  if (returnParamsOnly) return params;
  return await userSocialAccountRepo.createOne(params);
};
