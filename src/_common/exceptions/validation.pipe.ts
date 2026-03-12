import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    // CHECK VALUE ( OBJECT - NOT_EMPTY )
    if (value instanceof Object && this.isEmpty(value)) return value;
    // throw new HttpException('Validation failed: No body submitted', HttpStatus.BAD_REQUEST);

    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) return value;
    //TO VALIDATE THE INPUT ONLY NOT ALL OBJECTS
    if (metadata.type !== 'body') return value;
    // CLASS VALIDATION
    const transformedObject = plainToInstance(metatype, value);
    const errors = await validate(transformedObject);
    if (errors.length > 0)
      throw new HttpException(
        `${this.formatErrors(errors)}`,
        HttpStatus.BAD_REQUEST
      );

    return transformedObject;
  }

  // CHECK METATYPE FUNCTION
  private toValidate(metatype): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.find(type => metatype === type);
  }

  // FORMAT ERROR FUNCTION
  private formatErrors(errors: any[]): string {
    const firstError = errors.map(err => Object.values(err.constraints)[0]);
    return <string>(Array.isArray(firstError) ? firstError[0] : firstError);
  }

  // CHECK EMPTY OBJECT FUNCTION
  private isEmpty(value: any) {
    if (Object.keys(value).length > 0) return false;
    return true;
  }
}
