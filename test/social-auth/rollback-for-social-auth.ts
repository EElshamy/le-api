import { UserSocialAccount } from '../../src/social-auth/user-social-account.model';
import { UserSession } from '../../src/user-sessions/user-sessions.model';
import { buildRepository } from './../../src/_common/database/database-repository.builder';
import { IRepository } from './../../src/_common/database/repository.interface';
import { UserVerificationCode } from './../../src/user-verification-code/user-verification-code.model';
import { User } from './../../src/user/models/user.model';

export async function rollbackDbForSocialAuth() {
  const requiredRepos = [
    User,
    UserSession,
    UserVerificationCode,
    UserSocialAccount
  ].map(repo => new (buildRepository(repo))() as IRepository<typeof repo>);

  for (const repo of requiredRepos) {
    await repo.rawDelete();
  }
}
