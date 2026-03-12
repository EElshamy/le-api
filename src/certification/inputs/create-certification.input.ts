import { Field, InputType } from '@nestjs/graphql';
import { IsNotBlank } from '@src/_common/custom-validator/not-bank.validator';
import { UpperCaseLearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateCertificationInput {
  @IsOptional()
  @IsString()
  @Field(() => String)
  userId: string;

  @IsNotBlank()
  @MinLength(2)
  @MaxLength(50)
  @Field(() => String)
  arName: string;

  @IsNotBlank()
  @MinLength(2)
  @MaxLength(50)
  @Field(() => String)
  enName: string;

  @IsString()
  @Field(() => String)
  learningProgramId: string;

  @Field(() => UpperCaseLearningProgramTypeEnum)
  learningProgramType: UpperCaseLearningProgramTypeEnum;
}
