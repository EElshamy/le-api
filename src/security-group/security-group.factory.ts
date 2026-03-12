import { faker } from '@faker-js/faker';
import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { permissions } from './security-group-permissions';
import { SecurityGroup } from './security-group.model';

const securityGroupRepo = new (buildRepository(
  SecurityGroup
))() as IRepository<SecurityGroup>;

function getRandomPermissions(): string[] {
  const modules = Object.keys(permissions);
  return permissions[modules[faker.datatype.number(modules.length - 1)]];
}

type SecurityGroupType = {
  id?: string;
  groupName: string;
  description?: string;
  permissions: string[];
};

function buildParams(obj = <any>{}): SecurityGroupType {
  return {
    groupName: obj.groupName || faker.random.word(),
    description: obj.description || faker.lorem.paragraph(),
    permissions: obj.permissions || getRandomPermissions()
  };
}

export const SecurityGroupsFactory = async (
  count: number = 10,
  obj = <any>{}
): Promise<SecurityGroup[]> => {
  let securityGroups = [];
  for (let i = 0; i < count; i++) {
    securityGroups.push(buildParams(obj));
  }
  return await securityGroupRepo.bulkCreate(securityGroups);
};

export const SecurityGroupFactory = async (
  paramsOnly: boolean = false,
  obj = <any>{}
): Promise<SecurityGroup | SecurityGroupType> => {
  const params = buildParams(obj);
  if (paramsOnly) return params;
  return await securityGroupRepo.createOne(params);
};
