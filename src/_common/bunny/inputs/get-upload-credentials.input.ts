import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNotBlank } from '../../custom-validator/not-bank.validator';
import { IsMimeType, IsNotEmpty, IsOptional, MaxLength, Min, MinLength } from 'class-validator';
import { UploadedVideoLibrary } from '../bunny.type';

@InputType()
export class GetBunnyUploadCredentials {
  @IsNotBlank()
  @MinLength(2)
  @MaxLength(500)
  @Field()
  videoTitle: string;

  @Field(() => UploadedVideoLibrary)
  type: UploadedVideoLibrary;

  @Field()
  @IsNotEmpty()
  @MaxLength(250)
  @IsMimeType()
  contentType: string;

  @Min(1)
  @Field(() => Float)
  sizeInBytes: number;

  @IsOptional()
  @Field({ nullable: true })
  collectionId?: string;
}
