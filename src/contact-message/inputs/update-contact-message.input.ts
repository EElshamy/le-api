import { Field, ArgsType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@ArgsType()
export class UpdateContactMessageInput {
  @IsNotEmpty()
  @IsUUID('4')
  @Field()
  contactMessageId: string;
}
