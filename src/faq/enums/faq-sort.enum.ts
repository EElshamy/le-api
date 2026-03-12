import { registerEnumType } from '@nestjs/graphql';

export enum FaqSortEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

registerEnumType(FaqSortEnum, { name: 'FaqSortEnum' });
