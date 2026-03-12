import { registerEnumType } from '@nestjs/graphql';

export enum JobTitleSortEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TIMES_USED = 'timesUsed'
}
registerEnumType(JobTitleSortEnum, { name: 'JobTitleSortEnum' });
