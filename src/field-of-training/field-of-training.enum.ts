import { registerEnumType } from '@nestjs/graphql';

export enum FieldOfTrainingSortEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TIMES_USED = 'timesUsed'
}
registerEnumType(FieldOfTrainingSortEnum, { name: 'FieldOfTrainingSortEnum' });
