import { Field, InputType } from '@nestjs/graphql';
import { IsNotBlank } from '../../custom-validator/not-bank.validator';
import { MaxLength } from 'class-validator';
import { VdocipherFolderEnum } from '../vdocipher.type';

@InputType()
export class GetVdocipherUploadCredentials {
  @IsNotBlank()
  @MaxLength(500)
  @Field()
  videoTitle: string;

  @Field(() => VdocipherFolderEnum)
  folder: VdocipherFolderEnum;
}
