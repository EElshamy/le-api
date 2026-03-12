import { registerEnumType } from '@nestjs/graphql';

export enum DiplomaTypeEnum {
  PATH = 'PATH',
  SUBSCRIPTION = 'SUBSCRIPTION'
}

registerEnumType(DiplomaTypeEnum, { name: 'DiplomaTypeEnum' });
