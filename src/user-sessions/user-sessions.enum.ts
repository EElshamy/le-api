import { registerEnumType } from '@nestjs/graphql';

export enum ActionTypeEnum {
  SIGN_UP = 'SIGN_UP',
  LOGIN = 'LOGIN'
}
registerEnumType(ActionTypeEnum, { name: 'ActionTypeEnum' });
