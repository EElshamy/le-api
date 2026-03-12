import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsNotBlank } from '@src/_common/custom-validator/not-bank.validator';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';
import { ArrayMinSize } from 'class-validator';
import { ValidateNested } from '../../../_common/custom-validator/validate-nested.decorator';

@InputType()
export class CreateBlogCategoryInput {
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
export class BulkCreateBlogCategoryInput {
  @ValidateNested(CreateBlogCategoryInput)
  @ArrayMinSize(1)
  @Field(() => [CreateBlogCategoryInput])
  input: CreateBlogCategoryInput[];
}
