import { Inject } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { NestDataLoader } from '@src/_common/types/loader.interface';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';

export class AuthorsLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>
  ) {}
  generateDataLoader(currentUser?: User): DataLoader<any, any> {
    return new DataLoader(async (lecturerIds: string[]) => {
      return this.blogLecturerIds(lecturerIds);
    });
  }

  async blogLecturerIds(lecturerIds: string[]): Promise<Lecturer[]> {
    const authors = await this.lecturerRepo.findAll({
      id: lecturerIds
    });

    const res = lecturerIds.map(d => authors.find(c => c.id === d));

    return res;
  }
}
