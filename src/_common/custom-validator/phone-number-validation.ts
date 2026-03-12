import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';

export function ValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string): void {
    registerDecorator({
      name: 'phone number',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments): boolean {
          if (value?.replace(/\s+/g, '') && isValidPhoneNumber(value)) return true;
          return false;
        },
        defaultMessage(args: ValidationArguments): string {
          return <string>validationOptions?.message || ErrorCodeEnum[ErrorCodeEnum.INVALID_PHONE];
        }
      }
    });
  };
}
