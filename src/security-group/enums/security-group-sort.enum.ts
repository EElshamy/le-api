import { registerEnumType } from '@nestjs/graphql';

export enum SecurityGroupSortEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

registerEnumType(SecurityGroupSortEnum, {
  name: 'SecurityGroupSortEnum'
});
