import {
  Field,
  ID,
  InputType,
  Int,
  OmitType,
  PartialType
} from '@nestjs/graphql';
import {
  CreateQuizAnswerInput,
  CreateQuizInput,
  CreateQuizQuestionInput
} from './create-quiz.input';

@InputType()
export class UpdateQuizAnswerInput extends CreateQuizAnswerInput {
  @Field(() => String, { nullable: true })
  id?: string;
}

@InputType()
export class UpdateQuizQuestionInput extends OmitType(CreateQuizQuestionInput, [
  'answers'
] as const) {
  @Field(() => String, { nullable: true })
  id?: string;

  @Field(() => [UpdateQuizAnswerInput], { nullable: true })
  answers?: UpdateQuizAnswerInput[];
}

@InputType()
export class UpdateQuizInput extends PartialType(
  OmitType(CreateQuizInput, ['questions'] as const)
) {
  @Field(() => String)
  quizId: string;

  @Field(() => [UpdateQuizQuestionInput], { nullable: true })
  questions?: UpdateQuizQuestionInput[];
}
