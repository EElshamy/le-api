import { registerEnumType } from '@nestjs/graphql';

export enum ReporterTypeEnum {
  USER = 'USER',
  LECTURER = 'LECTURER',
  GUEST = 'GUEST'
}

registerEnumType(ReporterTypeEnum, {
  name: 'ReporterTypeEnum'
});
