import { Field, InputType } from '@nestjs/graphql';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';

@InputType()
export class CreateFieldOfTrainingBoardInput {
  @Field()
  @TextValidation({ minLength: 2, maxLength: 70, allowArabic: true })
  @IsNotBlank()
  arName: string;

  @Field()
  @TextValidation({ minLength: 2, maxLength: 70, allowArabic: false })
  @IsNotBlank()
  enName: string;

  @Field({ defaultValue: true })
  isActive: boolean;
}
