import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';
import { ArrayMinSize, IsNotEmpty } from 'class-validator';
import { ValidateNested } from '../../../_common/custom-validator/validate-nested.decorator';

@InputType()
export class CreateTagInput {
  @TextValidation({ minLength: 2, maxLength: 70, allowArabic: false })
  @Field()
  @IsNotEmpty()
  enName: string;

  @TextValidation({ minLength: 2, maxLength: 70, allowArabic: true })
  @IsNotEmpty()
  @Field()
  arName: string;

  @Field()
  isActive: boolean;
}

@ArgsType()
export class BulkCreateTagInput {
  @ValidateNested(CreateTagInput)
  @ArrayMinSize(1)
  @Field(() => [CreateTagInput])
  input: CreateTagInput[];
}
