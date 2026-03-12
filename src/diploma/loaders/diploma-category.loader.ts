import { Inject } from '@nestjs/common';
import { IRepository } from '@src/_common/database/repository.interface';
import { NestDataLoader } from '@src/_common/types/loader.interface';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { Category } from '@src/course-specs/category/category.model';

export class DiplomaCategoryLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.CategoriesRepository)
    private readonly categoryRepo: IRepository<Category>
  ) {}
  generateDataLoader(currentUser?: User): DataLoader<any, any> {
    return new DataLoader(async (categoryIds: number[]) => {
      return this.diplomaCategoryIds(categoryIds);
    });
  }

  async diplomaCategoryIds(categoryIds: number[]): Promise<Category[]> {
    const categories = await this.categoryRepo.findAll({
      id: categoryIds
    });
    const res = categoryIds.map(d => categories.find(c => c.id === d));
    return res;
  }
}
