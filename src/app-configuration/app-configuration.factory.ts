import { faker } from '@faker-js/faker';
import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { AppConfiguration } from './app-configuration.model';

const appConfigurationRepo = new (buildRepository(
  AppConfiguration
))() as IRepository<AppConfiguration>;

export type AppConfigurationType = {
  id?: string;
  key?: string;
  value: string;
  displayAs: string;
};

function buildParams(
  input = <any>{},
  returnInputOnly: boolean
): AppConfigurationType {
  return {
    key: input.key || faker.word.noun(),
    value: input.value || faker.word.noun(),
    displayAs: input.displayAs || faker.word.noun()
  };
}

export const AppConfigurationFactory = async (
  returnInputOnly: boolean = false,
  input = <any>{}
): Promise<AppConfiguration | AppConfigurationType> => {
  const params = buildParams(input, returnInputOnly);
  if (returnInputOnly) return params;
  return await appConfigurationRepo.createOne(params);
};

export const AppConfigurationsFactory = async (
  count: number = 10,
  input = <any>{}
): Promise<AppConfigurationType[]> => {
  let appConfigurations = [];
  for (let i = 0; i < count; i++)
    appConfigurations.push(buildParams(input, false));
  return await appConfigurationRepo.bulkCreate(appConfigurations);
};
