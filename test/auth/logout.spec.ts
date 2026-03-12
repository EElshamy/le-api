import { buildRepository } from '../../src/_common/database/database-repository.builder';
import { IRepository } from '../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from '../../src/_common/exceptions/error-code.enum';
import { ActionTypeEnum } from '../../src/user-sessions/user-sessions.enum';
import { UserSessionsFactory } from '../../src/user-sessions/user-sessions.factory';
import { UserSession } from '../../src/user-sessions/user-sessions.model';
import { UserFactory } from '../../src/user/factories/user.factory';
import { User } from '../../src/user/models/user.model';
import { LOGOUT, LOGOUT_OTHER_SESSIONS } from '../graphql/auth';
import { post } from '../request';
import { rollbackDbForAuth } from './rollback-for-auth';

interface UserSessionGeneratedDataInput {
  user?: User;
  overrideSessionData?: Partial<UserSession>;
  overrideUser?: Partial<User>;
}

const userSessionsRepo = new (buildRepository(UserSession))() as IRepository<UserSession>;

async function generateData(overrideData: UserSessionGeneratedDataInput = {}) {
  const user =
    overrideData.user || ((await UserFactory(false, { ...overrideData.overrideUser })) as User);
  const userSession = await UserSessionsFactory(overrideData.overrideSessionData, user);
  return { user, userSession };
}

describe('Logout', () => {
  afterEach(async () => {
    await rollbackDbForAuth();
  });

  it('logout successfully', async () => {
    const { user, userSession } = await generateData();
    const { body } = await post(LOGOUT, {}, user.token);

    const sessionAfterLogout = await userSessionsRepo.findOne({ id: userSession.id });
    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data).toBeTruthy();
    expect(sessionAfterLogout.isActive).toBeFalsy();
  });

  it('returns error for attempting to logout twice', async () => {
    const { user } = await generateData();
    const { body: firstLogout } = await post(LOGOUT, {}, user.token);

    expect(firstLogout.data.response.code).toBe(200);
    expect(firstLogout.data.response.data).toBeTruthy();

    const { body: secondLogout } = await post(LOGOUT, {}, user.token);
    expect(secondLogout.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('returns error for attempting to logout inactive session', async () => {
    const { user } = await generateData({ overrideSessionData: { isActive: false } });
    const { body } = await post(LOGOUT, {}, user.token);

    expect(body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('logout of other sessions', async () => {
    const { user, userSession } = await generateData();

    const token = user.token;
    await UserSessionsFactory({ actionType: ActionTypeEnum.LOGIN }, user);
    await UserSessionsFactory({ actionType: ActionTypeEnum.LOGIN }, user);
    await UserSessionsFactory({ actionType: ActionTypeEnum.LOGIN }, user);

    const { body } = await post(LOGOUT_OTHER_SESSIONS, {}, token);

    expect(body.data.response.code).toBe(200);
    expect(body.data.response.data).toBeTruthy();

    const userSessions = await userSessionsRepo.findAll({});

    const activeSession = userSessions.find(sess => sess.isActive);

    const inactiveSessions = userSessions.filter(session => !session.isActive);

    expect(activeSession.id).toBe(userSession.id);
    expect(inactiveSessions.length).toBe(3);
  });
});
