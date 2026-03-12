import { registerEnumType } from '@nestjs/graphql';

export enum FaqForEnum {
  ALL = 'ALL',
  USER = 'USER',
  LECTURER = 'DIPLOMA'
}

registerEnumType(FaqForEnum, { name: 'FaqForEnum' });
