import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { IDataLoaderService } from '../../_common/dataloader/dataloader.interface';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { Category } from './category.model';
import { CategoryLoaderType } from '../../_common/dataloader/dataloader.type';

@Injectable()
export class CategoryDataloader implements IDataLoaderService {
  constructor(
    @Inject(Repositories.CategoriesRepository) private readonly categoryRepo: IRepository<Category>
  ) {}
  createLoaders() {
    return {
      categoryByIdsLoader: <CategoryLoaderType>(
        new DataLoader(async (categoryIds: string[]) => await this.categoryByIds(categoryIds))
      )
    };
  }
  async categoryByIds(categoryIds: string[]): Promise<Category[]> {
    const categories = await this.categoryRepo.findAll({ id: categoryIds });

    return categoryIds.map(categoryId => categories.find(f => f.id === +categoryId));
  }
}
