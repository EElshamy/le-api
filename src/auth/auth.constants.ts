import { ValidationOptions } from 'class-validator';
import { ErrorCodeEnum } from '../_common/exceptions/error-code.enum';

export const EmailValidationConditions: [validator.IsEmailOptions, ValidationOptions] = [
  {
    allow_utf8_local_part: false,
    domain_specific_validation: true
  },
  { message: ErrorCodeEnum[ErrorCodeEnum.INVALID_EMAIL] }
];
