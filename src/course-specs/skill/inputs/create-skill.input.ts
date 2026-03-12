import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';
import { ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { IsNotBlank } from '../../../_common/custom-validator/not-bank.validator';
import { ValidateNested } from '../../../_common/custom-validator/validate-nested.decorator';

@InputType()
export class CreateSkillInput {
  @TextValidation({ minLength: 2, maxLength: 70, allowArabic: true })
  @IsNotBlank()
  @Field()
  arName: string;

  @TextValidation({ minLength: 2, maxLength: 70, allowArabic: false })
  @IsNotBlank()
  @Field()
  enName: string;

  @Field()
  isActive: boolean;
}

@ArgsType()
export class BulkCreateSkillInput {
  @ValidateNested(CreateSkillInput)
  @ArrayMinSize(1)
  @ArrayMaxSize(25)
  @Field(() => [CreateSkillInput])
  input: CreateSkillInput[];
}
