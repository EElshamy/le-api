import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotBlank } from '../../custom-validator/not-bank.validator';

@ArgsType()
export class GetVdocipherOtpForVideoPlayer {
  @IsNotBlank()
  @Field()
  videoId: string;
}
