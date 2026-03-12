import { faker } from '@faker-js/faker';
import { buildRepository } from '../_common/database/database-repository.builder';
import { IRepository } from '../_common/database/repository.interface';
import { DeviceEnum } from '../user/user.enum';
import { ActionTypeEnum } from './user-sessions.enum';
import { UserSession } from './user-sessions.model';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { User } from '../user/models/user.model';

const config = new ConfigService();
const userSessionsRepo = new (buildRepository(UserSession))() as IRepository<UserSession>;

type UserSessionType = {
  id?: string;
  userId: string;
  deviceName: string;
  ipAddress: string;
  actionType: ActionTypeEnum;
  country?: string;
  city?: string;
  device: DeviceEnum;
  fcmToken?: string;
  isActive: boolean;
};

function buildParams(input: Partial<UserSessionType> = {}): UserSessionType {
  return {
    deviceName: faker.lorem.word(),
    ipAddress: faker.internet.ip(),
    actionType: faker.helpers.arrayElement(Object.keys(ActionTypeEnum)) as any,
    device: faker.helpers.arrayElement(Object.keys(DeviceEnum)) as any,
    isActive: true,
    userId: input.userId,
    ...input
  };
}

export const UserSessionsFactory = async (
  input: Partial<UserSessionType> = {},
  user: User
): Promise<UserSession | UserSessionType> => {
  const params = buildParams({ ...input, userId: user.id });
  const session = await userSessionsRepo.createOne(params);

  Object.assign(user, {
    token: jwt.sign({ userId: user.id, sessionId: session.id }, config.get('JWT_SECRET'))
  });

  return session;
};
