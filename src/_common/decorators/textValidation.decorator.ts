import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions
} from 'class-validator';

interface TextValidationOptions {
  allowArabic?: boolean;
  minLength?: number;
  maxLength?: number;
  disallowedChars?: string[];
}

export function TextValidation(
  options: TextValidationOptions = {},
  validationOptions?: ValidationOptions
) {
  const {
    allowArabic = false,
    minLength = 2,
    maxLength = 100,
    disallowedChars = ['<', '>'] // Default disallowed characters
  } = options;

  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'TextValidation',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // Trim whitespace before validation
          value = value.trim();

          // Check length constraints
          if (value.length < minLength || value.length > maxLength)
            return false;

          // Check for disallowed characters
          const disallowedRegex = new RegExp(
            `[${disallowedChars.join('').replace(/[-/\\^$*+?.()|[\]{}]/g, '\$&')}]`,
            'g'
          );
          if (disallowedRegex.test(value)) return false;

          // Restrict or allow Arabic characters based on `allowArabic` flag
          if (!allowArabic && /[\u0600-\u06FF\u0660-\u0669]/.test(value)) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          // return `${args.property} must be between ${minLength}-${maxLength} characters, must not contain [${disallowedChars.join(', ')}], and must be ${allowArabic ? 'English or Arabic' : 'English only'}.`;
          return `${args.property} must be between ${minLength}-${maxLength} characters, and must be ${allowArabic ? 'English or Arabic' : 'English only'}.`;
        }
      }
    });
  };
}
