import { registerEnumType } from '@nestjs/graphql';

export enum ToolSortEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TIMES_USED = 'timesUsed'
}
registerEnumType(ToolSortEnum, { name: 'ToolSortEnum' });
