import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { CreateFaqInput } from './create-faq.input';

@InputType()
export class UpdateFaqInput extends PartialType(CreateFaqInput) {
  @IsNotEmpty()
  @IsUUID('4')
  @Field(type => ID)
  faqId: string;
}
