import { Field, ArgsType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@ArgsType()
export class ContactMessageInput {
  @IsNotEmpty()
  @IsUUID('4')
  @Field()
  contactMessageId: string;
}
