import { Field, ArgsType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@ArgsType()
export class FaqInput {
  @IsNotEmpty()
  @IsUUID('4')
  @Field()
  faqId: string;
}
