import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { Transform } from 'class-transformer';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';

export function ValidateName(minLength = 2, maxLength = 25) {
  return applyDecorators(
    Transform(val => val.value.trim()),
    IsNotEmpty(),
    IsNotBlank(),
    MinLength(minLength),
    MaxLength(maxLength),
    Matches(/^[a-zA-Z\u0621-\u064A\s]+$/, { message: ErrorCodeEnum[ErrorCodeEnum.INVALID_NAME] })
  );
}
