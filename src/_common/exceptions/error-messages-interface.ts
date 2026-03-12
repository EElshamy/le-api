import { ErrorCodeEnum } from './error-code.enum';

export type IErrorMessage = {
  [k in keyof typeof ErrorCodeEnum]: string;
};
