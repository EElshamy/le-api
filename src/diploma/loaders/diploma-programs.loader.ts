import { Inject } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { NestDataLoader } from '@src/_common/types/loader.interface';
import { Course } from '@src/course/models/course.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';
import { DiplomaCourses } from '../models/diploma-course.model';

export class DiplomaProgramsLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.DiplomaCoursesRepository)
    private readonly diplomaProgramsRepo: IRepository<DiplomaCourses>
  ) {}
  generateDataLoader(currentUser?: User): DataLoader<any, any> {
    return new DataLoader(async (diplomaIds: string[]) => {
      return this.programsByDiplomasIds(diplomaIds);
    });
  }

  async programsByDiplomasIds(diplomasIds: string[]) {
    const diplomasPrograms = await this.diplomaProgramsRepo.findAll(
      {
        diplomaId: diplomasIds,
        keptForOldAssignments: false
      },
      [
        {
          model: Course,
          where: {
            // publicationStatus: PublicationStatusEnum.PUBLIC
          },
          include: [{ model: Lecturer, include: [{ model: User }] }]
        }
      ]
    );

    const mappedDiplomasPrograms = diplomasIds.map(dId =>
      diplomasPrograms.filter(dip => dip.diplomaId === dId)
    );

    const res = mappedDiplomasPrograms.map(mdp => mdp.map(d => d.course));

    return res;
  }
}
