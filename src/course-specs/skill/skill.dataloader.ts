import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { IDataLoaderService } from '../../_common/dataloader/dataloader.interface';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { CategoryLoaderType, SkillLoaderType } from '../../_common/dataloader/dataloader.type';
import { Skill } from './models/skill.model';
import { Course } from '../../course/models/course.model';

@Injectable()
export class SkillDataloader implements IDataLoaderService {
  constructor(
    @Inject(Repositories.SkillsRepository) private readonly skillRepo: IRepository<Skill>
  ) {}
  createLoaders() {
    return {
      skillByCourseIdsLoader: <SkillLoaderType>(
        new DataLoader(async (courseIds: string[]) => await this.skillByCourseId(courseIds))
      )
    };
  }
  async skillByCourseId(courseIds: string[]): Promise<Skill[]> {
    const skills = await this.skillRepo.findAll({}, [
      { model: Course, through: { where: { courseId: courseIds } } }
    ]);
    const skillCourse = skills.reduce((acc: { [key: number]: Skill[] }, skill: Skill) => {
      skill.courseSkill.forEach(course => (acc[course.id] = [...(acc[course.id] ?? []), skill]));
      return acc;
    }, {});

    return courseIds.map(courseId => skillCourse[courseId] ?? []);
  }
}
