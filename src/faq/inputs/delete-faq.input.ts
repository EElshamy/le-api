import { Field, ArgsType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@ArgsType()
export class DeleteFaqInput {
  @IsNotEmpty()
  @IsUUID('4')
  @Field()
  faqId: string;
}
