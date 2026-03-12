import { registerEnumType } from '@nestjs/graphql';

export enum ReportSortEnum {
  CREATED_AT = 'createdAt'
}

registerEnumType(ReportSortEnum, {
  name: 'ReportSortEnum'
});
