import {
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
  validateSync
} from 'class-validator';
import { plainToInstance } from 'class-transformer';

// A custom decorator to validate a validation-schema within a validation schema upload N levels
export function ValidateNested(schema: any, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'ValidateNested',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return false;
          args.value;
          if (Array.isArray(value)) {
            for (let i = 0; i < (<Array<any>>value).length; i++) {
              if (validateSync(plainToInstance(schema, value[i])).length) {
                return false;
              }
            }
            return true;
          } else return validateSync(plainToInstance(schema, value)).length ? false : true;
        },
        defaultMessage(args) {
          if (!args.value) return;
          if (Array.isArray(args.value)) {
            let validationMessage = '';
            for (let i = 0; i < (<Array<any>>args.value).length; i++) {
              const constraints = validateSync(plainToInstance(schema, args.value[i])).map(
                e => e.constraints
              );

              if (!constraints.length) continue;

              const indexMessage = `${args.property}::index::${i} -> ${constraints
                .reduce((acc, next) => acc.concat(Object.values(next)), [])
                .toString()}`;

              validationMessage =
                `${validationMessage ? validationMessage + ', ' : ''}` + indexMessage;
            }
            return validationMessage;
          } else {
            const validationErrorMaping = validateSync(plainToInstance(schema, args.value))
              .map(e => e.constraints)
              .reduce((acc, next) => acc.concat(Object.values(next)), [])
              .toString();

            return validationErrorMaping.split(',')[0];
          }
        }
      }
    });
  };
}
