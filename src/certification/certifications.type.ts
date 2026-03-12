import { registerEnumType } from '@nestjs/graphql';

export enum CertificationType {
  LEIAQA = 'LEIAQA',
  ACE = 'ACE',
  LDISAUDI = 'LDISAUDI',
  NASM = 'NASM'
}

registerEnumType(CertificationType, { name: 'CertificationType' });
