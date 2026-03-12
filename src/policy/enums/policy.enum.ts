import { registerEnumType } from '@nestjs/graphql';

export enum PolicyEnum {
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  TERMS_AND_CONDITIONS = 'TERMS_AND_CONDITIONS',
  PAYMENT_POLICY = 'PAYMENT_POLICY'
}

registerEnumType(PolicyEnum, {
  name: 'PolicyEnum'
});
