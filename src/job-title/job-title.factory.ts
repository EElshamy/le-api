import { faker } from '@faker-js/faker';
import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { JobTitle } from './job-title.model';

const jobTitleRepo = new (buildRepository(JobTitle))() as IRepository<JobTitle>;

function buildParams(input = <any>{}): Partial<JobTitle> {
  return {
    enName: faker.lorem.word(),
    arName: faker.lorem.word(),
    isActive: input.isActive,
    ...input
  };
}

export const JobTitleFactory = async (
  input = <any>{},
  returnInputOnly: boolean = false
): Promise<JobTitle | Partial<JobTitle>> => {
  const params = buildParams(input);
  if (returnInputOnly) return params;
  return await jobTitleRepo.createOne(params);
};

export const JobTitlesFactory = async (
  count: number = 10,
  input = <any>{}
): Promise<JobTitle[]> => {
  let jobTitles = [];
  for (let i = 0; i < count; i++) jobTitles.push(buildParams(input));
  return await jobTitleRepo.bulkCreate(jobTitles);
};
