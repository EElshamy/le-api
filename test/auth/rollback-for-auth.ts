import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { UserVerificationCode } from '@src/user-verification-code/user-verification-code.model';
import { User } from '@src/user/models/user.model';
import { FieldOfTraining } from '../../src/field-of-training/field-of-training.model';
import { JobTitle } from '../../src/job-title/job-title.model';
import { Lecturer } from '../../src/lecturer/models/lecturer.model';
import { LecturerRequest } from '../../src/lecturer/models/lecturer.request.model';
import { SecurityGroup } from '../../src/security-group/security-group.model';
import { UserSession } from '../../src/user-sessions/user-sessions.model';

export async function rollbackDbForAuth() {
  const requiredRepos = [
    User,
    UserSession,
    UserVerificationCode,
    Lecturer,
    LecturerRequest,
    JobTitle,
    FieldOfTraining,
    SecurityGroup
  ].map(repo => new (buildRepository(repo))() as IRepository<typeof repo>);

  for (const repo of requiredRepos) {
    await repo.rawDelete();
  }
}
