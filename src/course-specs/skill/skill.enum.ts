import { registerEnumType } from '@nestjs/graphql';

export enum SkillSortEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TIMES_USED = 'timesUsed'
}
registerEnumType(SkillSortEnum, { name: 'SkillSortEnum' });
