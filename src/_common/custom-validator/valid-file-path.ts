import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';

export function ValidFilePath(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'FilePath',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any) {
          if (typeof value === 'string' && value.search('http') > -1) return false;

          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          return ErrorCodeEnum[ErrorCodeEnum.URL_CANNOT_CONTAIN_THE_DOMAIN];
        }
      }
    });
  };
}
