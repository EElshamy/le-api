import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { IDataLoaderService } from '../../_common/dataloader/dataloader.interface';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { ToolLoaderType } from '../../_common/dataloader/dataloader.type';
import { Course } from '../../course/models/course.model';
import { Tool } from './models/tool.model';

@Injectable()
export class ToolDataloader implements IDataLoaderService {
  constructor(@Inject(Repositories.ToolsRepository) private readonly toolRepo: IRepository<Tool>) {}
  createLoaders() {
    return {
      toolByCourseIdsLoader: <ToolLoaderType>(
        new DataLoader(async (courseIds: string[]) => await this.toolByCourseId(courseIds))
      )
    };
  }
  async toolByCourseId(courseIds: string[]): Promise<Tool[]> {
    const skills = await this.toolRepo.findAll({}, [
      { model: Course, through: { where: { courseId: courseIds } } }
    ]);
    const skillCourse = skills.reduce((acc: { [key: number]: Tool[] }, skill: Tool) => {
      skill.courseTool.forEach(course => (acc[course.id] = [...(acc[course.id] ?? []), skill]));
      return acc;
    }, {});

    return courseIds.map(courseId => skillCourse[courseId] ?? []);
  }
}
