import { faker } from '@faker-js/faker';
import { ConfigService } from '@nestjs/config';
import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { User } from '@src/user/models/user.model';
import { GenderEnum, LangEnum, UserRoleEnum } from '@src/user/user.enum';
import * as bcrypt from 'bcryptjs';
import { isEmail } from 'class-validator';
import * as uuid from 'uuid';
import { HelperService } from '../../_common/utils/helper.service';
import { EmailValidationConditions } from '../../auth/auth.constants';
import { ActionTypeEnum } from '../../user-sessions/user-sessions.enum';
import { UserSession } from '../../user-sessions/user-sessions.model';

const config = new ConfigService();
const helper = new HelperService(config);
const userRepo = new (buildRepository(User))() as IRepository<User>;
const userSessionsRepo = new (buildRepository(
  UserSession
))() as IRepository<UserSession>;

type UserType = {
  id?: string;
  firstName: string;
  lastName: string;
  arFullName: string;
  enFullName: string;
  code?: string;
  email: string;
  unverifiedEmail: string;
  phone: string;
  password?: string;
  gender: GenderEnum;
  role: UserRoleEnum;
  profilePicture?: string;
  isBlocked: boolean;
  isDeleted?: boolean;
  favLang: LangEnum;
  securityGroupId?: string;
  token?: string;
  country?: string;
  nationality?: string;
};

function buildParams(input = <any>{}): UserType {
  return {
    arFullName: 'محمد صلاح',
    enFullName: 'Mohamed salah',
    firstName: input.firstName || generateRandomName(),
    lastName: input.lastName || generateRandomName(),
    email: input.email || generateRandomEmail(),
    gender: input.gender || faker.helpers.arrayElement(['MALE', 'FEMALE']),
    role: input.role || UserRoleEnum.USER,
    unverifiedEmail: input.unverifiedEmail || generateRandomEmail(),
    profilePicture: input.avatar || faker.lorem.word(),
    isBlocked: input.isBlocked !== undefined ? input.isBlocked : false,
    phone: input.phone || faker.helpers.fromRegExp('+2010[0-9]{8}'),
    isDeleted: input.isDeleted !== undefined ? input.isDeleted : false,
    favLang: input.favLang || faker.helpers.arrayElement(['EN', 'AR']),
    securityGroupId: input.securityGroupId,
    country: 'EG',
    nationality: 'EG',
    passwordResetSessionId: uuid.v4(),
    ...input,
    password: input.password
      ? bcrypt.hashSync(input.password, 12)
      : input.password === null
        ? null
        : bcrypt.hashSync('123456', 12)
  };
}

export const UsersFactory = async (
  count = 10,
  input = <any>{}
): Promise<User[]> => {
  const users = [];
  for (let i = 0; i < count; i++) users.push(buildParams(input));
  return await userRepo.bulkCreate(users);
};

export const UserFactory = async (
  returnInputOnly = false,
  input = <any>{},
  includeSession = false,
  isPasswordSession = false
): Promise<UserType | User> => {
  const params = buildParams(input);
  if (returnInputOnly) return params;

  const user = await userRepo.createOne(params);
  let session;
  includeSession &&
    !isPasswordSession &&
    (session = await userSessionsRepo.createOne({
      userId: user.id,
      ...input.loginDetails,
      actionType: ActionTypeEnum.SIGN_UP
    }));

  return Object.assign(user, {
    token: helper.generateAuthToken({
      userId: user.id,
      ...(session && !isPasswordSession && { sessionId: session.id }),
      ...(isPasswordSession && {
        sessionId: user.passwordResetSessionId,
        expiresIn: '24h'
      })
    })
  });
};

function generateRandomEmail() {
  let counter = 0,
    randomEmail;
  do {
    counter += 1;
    if (counter >= 10) return;
    randomEmail = faker.internet.email();
  } while (!isEmail(randomEmail, EmailValidationConditions[0]));
  return randomEmail;
}

function generateRandomName() {
  let counter = 0,
    randomName;
  do {
    counter += 1;
    if (counter >= 10) return;
    randomName = faker.person.firstName();
  } while (!/^[a-zA-Z\u0621-\u064A\s]+$/.test(randomName));
  return randomName;
}
