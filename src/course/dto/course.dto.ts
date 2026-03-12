import { IsNotBlank } from '@src/_common/custom-validator/not-bank.validator';
import { ValidFilePath } from '@src/_common/custom-validator/valid-file-path';
import { MinLength } from 'class-validator';

export class CourseDto {
  @MinLength(2)
  @IsNotBlank()
  @ValidFilePath()
  thumbnail: string;
}
