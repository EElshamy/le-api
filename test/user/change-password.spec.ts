import { UserSession } from '../../src/user-sessions/user-sessions.model';
import { OTHER_VALID_PASSWORD, VALID_PASSWORD } from '../constants';
import { CHANGE_PASSWORD } from '../graphql/user';
import { post } from '../request';
import { buildRepository } from './../../src/_common/database/database-repository.builder';
import { IRepository } from './../../src/_common/database/repository.interface';
import { ErrorCodeEnum } from './../../src/_common/exceptions/error-code.enum';
import { UserFactory } from './../../src/user/factories/user.factory';
import { User } from './../../src/user/models/user.model';

async function rollbackDb() {
  const userRepo = new (buildRepository(User))() as IRepository<User>;
  const userSessionRepo = new (buildRepository(
    UserSession
  ))() as IRepository<UserSession>;

  await userRepo.rawDelete();
  await userSessionRepo.rawDelete();
}

describe('Change password suite case', () => {
  afterEach(async () => {
    await rollbackDb();
  });

  it('return_error_if_not_authenticated', async () => {
    const res = await post(CHANGE_PASSWORD, {
      input: {
        oldPassword: VALID_PASSWORD,
        newPassword: OTHER_VALID_PASSWORD
        // confirmPassword: OTHER_VALID_PASSWORD
      }
    });

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_blocked_user', async () => {
    const user = await UserFactory(false, { isBlocked: true }, true);

    const res = await post(
      CHANGE_PASSWORD,
      {
        input: {
          oldPassword: VALID_PASSWORD,
          newPassword: OTHER_VALID_PASSWORD
          // confirmPassword: OTHER_VALID_PASSWORD
        }
      },
      user.token
    );

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_old_password_does_not_match', async () => {
    const user = await UserFactory(false, { password: '123458' }, true);

    const res = await post(
      CHANGE_PASSWORD,
      {
        input: {
          oldPassword: VALID_PASSWORD,
          newPassword: OTHER_VALID_PASSWORD
          // confirmPassword: OTHER_VALID_PASSWORD
        }
      },
      user.token
    );

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.WRONG_PASSWORD);
  });

  // it('return_error_if_password_not_confirmed_successfully', async () => {
  //   const user = await UserFactory(false, { password: VALID_PASSWORD }, true);

  //   const res = await post(
  //     CHANGE_PASSWORD,
  //     {
  //       input: {
  //         oldPassword: VALID_PASSWORD,
  //         newPassword: OTHER_VALID_PASSWORD,
  //         confirmPassword: 'x1234565'
  //       }
  //     },
  //     user.token
  //   );

  //   expect(res.body.data.response.code).toBe(ErrorCodeEnum.CONFIRM_PASSWORD_DOESN_T_MATCH);
  // });

  it('return error if new password is the same as old password', async () => {
    const user = await UserFactory(false, { password: VALID_PASSWORD }, true);

    const res = await post(
      CHANGE_PASSWORD,
      {
        input: {
          oldPassword: VALID_PASSWORD,
          newPassword: VALID_PASSWORD
          // confirmPassword: VALID_PASSWORD
        }
      },
      user.token
    );

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.OLD_PASSWORD);
  });

  it('return error if old password is missing when the user has password', async () => {
    const user = await UserFactory(false, { password: VALID_PASSWORD }, true);

    const res = await post(
      CHANGE_PASSWORD,
      {
        input: {
          oldPassword: null,
          newPassword: VALID_PASSWORD
          // confirmPassword: VALID_PASSWORD
        }
      },
      user.token
    );

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.WRONG_PASSWORD);
  });

  it('set new password if the user has no password', async () => {
    const user = await UserFactory(false, { password: null }, true);

    const res = await post(
      CHANGE_PASSWORD,
      {
        input: {
          oldPassword: null,
          newPassword: VALID_PASSWORD
          // confirmPassword: VALID_PASSWORD
        }
      },
      user.token
    );

    expect(res.body.data.response.code).toBe(200);
  });

  it('change_password', async () => {
    const user = await UserFactory(false, { password: VALID_PASSWORD }, true);

    const res = await post(
      CHANGE_PASSWORD,
      {
        input: {
          oldPassword: VALID_PASSWORD,
          newPassword: OTHER_VALID_PASSWORD
          // confirmPassword: OTHER_VALID_PASSWORD
        }
      },
      user.token
    );

    expect(res.body.data.response.code).toBe(200);
  });
});
