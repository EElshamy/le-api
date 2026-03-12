import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { IDataLoaderService } from '../_common/dataloader/dataloader.interface';
import { JobTitleLoaderType } from '../_common/dataloader/dataloader.type';
import { Repositories } from '../_common/database/database-repository.enum';
import { IRepository } from '../_common/database/repository.interface';
import { HelperService } from '../_common/utils/helper.service';
import { JobTitle } from './job-title.model';

@Injectable()
export class JobTitleDataloader implements IDataLoaderService {
  constructor(
    @Inject(Repositories.JobTitlesRepository) private readonly jobTitleRepo: IRepository<JobTitle>,
    private readonly helperService: HelperService
  ) {}
  createLoaders() {
    return {
      jobTitleLoader: <JobTitleLoaderType>(
        new DataLoader(async (jobTitleIds: string[]) => await this.findJobTitlesByIds(jobTitleIds))
      )
    };
  }

  async findJobTitlesByIds(jobTitleIds: string[]) {
    return await this.helperService.getItemsByIdsAndMap(jobTitleIds, this.jobTitleRepo);
  }
}
