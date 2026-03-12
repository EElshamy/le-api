import { Field, ArgsType, InputType } from '@nestjs/graphql';
import { Upload, UploadedFile } from './uploader.type';
import { UploadScalar } from './uploader.scalar';
import { FileModelEnum } from './file.enum';

@ArgsType()
export class UploadFileInput {
  @Field(type => UploadScalar, { nullable: true })
  file?: Upload | string;

  @Field(type => FileModelEnum, { nullable: true })
  model?: FileModelEnum;
}

export class FileHandlingInput {
  file: Upload | string | UploadedFile;

  saveTo: FileModelEnum;
}

@InputType()
export class FileToMakePublic {
  @Field(() => FileModelEnum)
  model: FileModelEnum;

  @Field()
  fileName: string;
}

