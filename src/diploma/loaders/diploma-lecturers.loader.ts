import { Inject, Injectable } from '@nestjs/common';
import { NestDataLoader } from '@src/_common/types/loader.interface';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { Course } from '@src/course/models/course.model';
import { DiplomaService } from '../diploma.service';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { Diploma } from '../models/diploma.model';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';

@Injectable()
export class DiplomaLecturersLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomasRepo: IRepository<Diploma>
  ) {}

  generateDataLoader(currentUser?: User): DataLoader<any, any> {
    return new DataLoader(async (diplomaIds: string[]) => {
      return this.lecturersByDiplomaIds(diplomaIds);
    });
  }

  getUniqueObjects(array: any[], uniqueKey: string): any[] {
    return array.filter(
      (item, index, self) =>
        index === self.findIndex(t => t?.[uniqueKey] === item?.[uniqueKey])
    );
  }

  async lecturersByDiplomaIds(diplomaIds: string[]): Promise<User[][]> {
    let diplomas = [];
    try {
      diplomas = await this.diplomasRepo.findAll(
        {
          id: diplomaIds
        },
        [
          {
            model: Course,
            include: [
              {
                model: CourseLecturer,
                include: [
                  {
                    model: Lecturer,
                    include: [{ model: User }]
                  }
                ]
              }
            ]
          }
        ]
      );
    } catch (error) {
      console.log(error);
    }

    return (
      diplomas.map(d =>
        this.getUniqueObjects(
          d.courses.flatMap(course =>
            course.courseLecturers?.map(cl => cl?.lecturer?.user) || []
          ),
          'id'
        )
      ) || []
    );
  }
}
