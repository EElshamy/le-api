import { ValidateBy, ValidationArguments, ValidationOptions } from 'class-validator';
import { AsyncLocalStorage } from 'async_hooks';

export const asyncStorage = new AsyncLocalStorage<{ lang: string }>();

export function getLanguage() {
  return asyncStorage.getStore()?.lang || 'en';
}

export function IsNotBlank(validationOptions?: ValidationOptions ) {

  return ValidateBy(
    {
      name: 'isNotBlank',
      constraints: [],
      validator: {
        validate(value: any, args : ValidationArguments) {
          return typeof value === 'string' && value.trim().length > 0;
        },
        defaultMessage: options =>{
          const properityName = options.property.replace(/([A-Z])/g, ' $1').trim().toLowerCase();     
          return getLanguage() === 'Eg-ar' ?  `${properityName} لا يجب ان يكون فارغا` : `${properityName} must not be blank`
        } 
      }
    },
    validationOptions
  );
}
