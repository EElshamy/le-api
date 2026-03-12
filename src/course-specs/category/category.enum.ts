import { registerEnumType } from '@nestjs/graphql';

export enum CategorySortEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TIMES_USED = 'timesUsed'
}
registerEnumType(CategorySortEnum, { name: 'CategorySortEnum' });
