import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { NestDataLoader } from '@src/_common/types/loader.interface';
import { Skill } from '@src/course-specs/skill/models/skill.model';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';
import { Diploma } from '../models/diploma.model';

@Injectable()
export class DiplomaSkillsLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.SkillsRepository)
    private readonly skillRepo: IRepository<Skill>
  ) {}
  generateDataLoader(currentUser?: User): DataLoader<string | number, Skill> {
    return new DataLoader(async (diplomaIds: string[]) => {
      return this.skillsByDiplomaIds(diplomaIds);
    });
  }
  async skillsByDiplomaIds(diplomaIds: string[]): Promise<Skill[]> {
    const skills = await this.skillRepo.findAll({}, [
      { model: Diploma, through: { where: { diplomaId: diplomaIds } } }
    ]);
    const skillsDiploma = skills.reduce(
      (acc: { [key: number]: Skill[] }, skill: Skill) => {
        skill.diplomaSkill.forEach(
          diploma => (acc[diploma.id] = [...(acc[diploma.id] ?? []), skill])
        );
        return acc;
      },
      {}
    );
    return diplomaIds.map(diplomaId => skillsDiploma[diplomaId] ?? []);
  }
}
