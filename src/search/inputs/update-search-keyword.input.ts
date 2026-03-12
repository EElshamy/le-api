import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateSearchKeywordInput } from './create-search-keyword.input';

@InputType()
export class UpdateSearchKeywordInput extends PartialType(
  CreateSearchKeywordInput
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
