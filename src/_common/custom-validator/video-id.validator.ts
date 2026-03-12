import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions
} from 'class-validator';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ValidVideoId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'ValidVideoId',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any) {
          if (typeof value !== 'string') return false;
          if (!UUID_REGEX.test(value)) return false;
          if (value.includes('/') || value.startsWith('http')) return false;

          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          return ErrorCodeEnum[ErrorCodeEnum.INVALID_VIDEO_ID];
        }
      }
    });
  };
}
