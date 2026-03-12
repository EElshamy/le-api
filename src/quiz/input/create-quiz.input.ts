import { Field, InputType, PartialType } from '@nestjs/graphql';
import { QuizDurationEnum, QuizRelatedTypeEnum } from '../enum/quiz.enum';
import { ArrayMinSize, Max, Min, ValidateNested } from 'class-validator';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';

@InputType()
export class CreateQuizQuestionInput {
  @Field(() => String)
  @TextValidation({ minLength: 2, maxLength: 200, allowArabic: true })
  enQuestionTitle: string;

  @Field(() => String)
  @TextValidation({ minLength: 2, maxLength: 200, allowArabic: true })
  arQuestionTitle: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  isMultipleAnswers: boolean;

  @Field(() => Number, { nullable: true })
  order: number;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Field(() => [CreateQuizAnswerInput])
  answers: CreateQuizAnswerInput[];
}

@InputType()
export class CreateQuizAnswerInput {
  @Field(() => String)
  @TextValidation({ minLength: 2, maxLength: 200, allowArabic: true })
  enAnswerTitle: string;

  @Field(() => String)
  @TextValidation({ minLength: 2, maxLength: 200, allowArabic: true })
  arAnswerTitle: string;

  // @Field(() => Number, { nullable: true })
  // order: number;

  @Field(() => Boolean, { defaultValue: false })
  isCorrect: boolean;
}

@InputType()
export class CreateQuizInput {

  @Max(100)
  @Min(0)
  @Field(() => Number)
  passingGrade: number;

  @Min(1)
  @Field(() => Number)
  duration: number;

  @Field(() => QuizDurationEnum)
  durationType: QuizDurationEnum;

  @Field({ nullable: true })
  attemptsAllowed: number;

  @Field({ defaultValue: false })
  showCorrectAnswers?: boolean;

  @Field(() => Number)
  lessonId: number;

  @ArrayMinSize(1)
  @Field(() => [CreateQuizQuestionInput])
  questions: CreateQuizQuestionInput[];
}
