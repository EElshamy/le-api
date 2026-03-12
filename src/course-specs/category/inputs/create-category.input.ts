import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';
import { ArrayMaxSize, ArrayMinSize, IsOptional } from 'class-validator';
import { IsNotBlank } from '../../../_common/custom-validator/not-bank.validator';
import { ValidateNested } from '../../../_common/custom-validator/validate-nested.decorator';
import { ValidFilePath } from '@src/_common/custom-validator/valid-file-path';

@InputType()
export class CreateCategoryInput {
  @TextValidation({ minLength: 2, maxLength: 70, allowArabic: true })
  @IsNotBlank()
  @Field()
  arName: string;

  @TextValidation({ minLength: 2, maxLength: 70, allowArabic: false })
  @Field()
  enName: string;

  @IsNotBlank()
  @ValidFilePath()
  @IsOptional()
  @Field({ nullable: true })
  image?: string;

  @Field()
  isActive: boolean;
}

@ArgsType()
export class BulkCreateCategoryInput {
  @ValidateNested(CreateCategoryInput)
  @ArrayMinSize(1)
  @ArrayMaxSize(25)
  @Field(() => [CreateCategoryInput])
  input: CreateCategoryInput[];
}
