import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { ValidFilePath } from '../../../_common/custom-validator/valid-file-path';
import { Transform } from 'class-transformer';
import { IsNotBlank } from '../../../_common/custom-validator/not-bank.validator';
import { ArrayMaxSize, ArrayMinSize, MaxLength, MinLength } from 'class-validator';
import { ValidateNested } from '../../../_common/custom-validator/validate-nested.decorator';

@InputType()
export class CreateToolInput {
  @IsNotBlank()
  @MinLength(2)
  @MaxLength(50)
  @Transform(val => val.value.trim())
  @Field()
  name: string;

  @ValidFilePath()
  @Field()
  image: string;

  @Field()
  isActive: boolean;
}

@ArgsType()
export class BulkCreateToolInput {
  @ValidateNested(CreateToolInput)
  @ArrayMinSize(1)
  @ArrayMaxSize(25)
  @Field(() => [CreateToolInput])
  input: CreateToolInput[];
}
