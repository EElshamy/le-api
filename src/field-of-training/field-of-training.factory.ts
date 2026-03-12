import { faker } from '@faker-js/faker';
import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { FieldOfTraining } from './field-of-training.model';

const fieldOfTrainingRepo = new (buildRepository(
  FieldOfTraining
))() as IRepository<FieldOfTraining>;

function buildParams(input = <any>{}): Partial<FieldOfTraining> {
  return {
    enName: faker.lorem.word(),
    arName: faker.lorem.word(),
    isActive: input.isActive,
    ...input
  };
}

export const FieldOfTrainingFactory = async (
  input = <any>{},
  returnInputOnly: boolean = false
): Promise<FieldOfTraining | Partial<FieldOfTraining>> => {
  const params = buildParams(input);
  if (returnInputOnly) return params;
  return await fieldOfTrainingRepo.createOne(params);
};

export const FieldOfTrainingsFactory = async (
  count: number = 10,
  input = <any>{}
): Promise<FieldOfTraining[]> => {
  let fieldOfTrainings = [];
  for (let i = 0; i < count; i++) fieldOfTrainings.push(buildParams(input));
  return await fieldOfTrainingRepo.bulkCreate(fieldOfTrainings);
};
