import { Field, Float, InputType } from '@nestjs/graphql';
import { ValidFilePath } from '@src/_common/custom-validator/valid-file-path';
import { FileModelEnum } from '@src/_common/uploader/file.enum';
import {
  IsMimeType,
  IsNotEmpty,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';

@InputType()
export class GenerateUploadPreSignedUrlInput {
  @Field(() => FileModelEnum)
  model: FileModelEnum;

  @Field()
  @IsNotEmpty()
  @MaxLength(250)
  @IsMimeType()
  contentType: string;

  @Field()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(250)
  fileName: string;

  @Min(1)
  @Max(52428800, { message: 'Max File Size exceeded' }) //50 * 1024 * 1024 (50 megabytes)
  @Field(() => Float)
  sizeInBytes: number;
}
@InputType()
export class GenerateFileUrlInput {
  @ValidFilePath({ message: 'File path cannot contain base url' })
  @IsNotEmpty()
  @Field()
  filePath: string;
}
