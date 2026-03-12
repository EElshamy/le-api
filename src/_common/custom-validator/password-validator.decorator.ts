import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';

export function PasswordValidator(
  validationOptions?: ValidationOptions,
  minLength = 8,
  maxLength = 25
) {
  return function (object: Object, propertyName: string): void {
    registerDecorator({
      name: 'password',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments): boolean {
          if (typeof value !== 'string') {
            return false;
          }

          if (value.length < minLength || value.length > maxLength) {
            return false;
          }

          if (/\s/.test(value)) {
            return false;
          }

          if (!/^[\p{P}\w$^]+$/u.test(value)) {
            return false;
          }

          if (!/[A-Za-z]/.test(value)) {
            return false;
          }

          if (!/\d/.test(value)) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          return ErrorCodeEnum[ErrorCodeEnum.INVALID_PASSWORD];
        }
      }
    });
  };
}
