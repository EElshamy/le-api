import { registerEnumType } from '@nestjs/graphql';
export enum ProgramsPublicationStatusEnum {
  ALL_PUBLIC = 'ALL_PUBLIC',
  ALL_PRIVATE = 'ALL_PRIVATE',
  SOME_PRIVATE = 'SOME_PRIVATE'
}
registerEnumType(ProgramsPublicationStatusEnum, {
  name: 'ProgramsPublicationStatusEnum'
});
