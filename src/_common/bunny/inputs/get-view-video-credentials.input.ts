import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { MaxLength, MinLength } from 'class-validator';
import { IsNotBlank } from '../../custom-validator/not-bank.validator';
import { UploadedVideoLibrary } from '../bunny.type';

@InputType()
export class GetBunnyViewVideoSignature {
  @IsNotBlank()
  @MaxLength(500)
  @MinLength(2)
  @Field()
  videoId: string;

  @Field(() => UploadedVideoLibrary)
  type: UploadedVideoLibrary;
}

@InputType()
export class ReEncodeBunnyVideosInput {
  @Field(() => UploadedVideoLibrary)
  type: UploadedVideoLibrary;

  @Field(() => [String])
  videoIds: string[];
}
