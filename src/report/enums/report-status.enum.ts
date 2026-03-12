import { registerEnumType } from '@nestjs/graphql';

export enum ReportStatusEnum {
  OPEN = 'OPEN',
  INVALID = 'INVALID',
  RESOLVED = 'RESOLVED'
}

registerEnumType(ReportStatusEnum, {
  name: 'ReportStatusEnum'
});
