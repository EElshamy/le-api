import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { NestDataLoader } from '@src/_common/types/loader.interface';
import { Tool } from '@src/course-specs/tool/models/tool.model';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';
import { Diploma } from '../models/diploma.model';

@Injectable()
export class DiplomaToolsLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.ToolsRepository)
    private readonly toolRepo: IRepository<Tool>
  ) {}
  generateDataLoader(currentUser?: User): DataLoader<string | number, Tool> {
    return new DataLoader(async (diplomaIds: string[]) => {
      return this.toolsByDiplomaIds(diplomaIds);
    });
  }
  async toolsByDiplomaIds(diplomaIds: string[]): Promise<Tool[]> {
    const tools = await this.toolRepo.findAll({}, [
      { model: Diploma, through: { where: { diplomaId: diplomaIds } } }
    ]);
    const toolsDiploma = tools.reduce(
      (acc: { [key: number]: Tool[] }, tool: Tool) => {
        tool.diplomaTool.forEach(
          diploma => (acc[diploma.id] = [...(acc[diploma.id] ?? []), tool])
        );
        return acc;
      },
      {}
    );
    return diplomaIds.map(diplomaId => toolsDiploma[diplomaId] ?? []);
  }
}
