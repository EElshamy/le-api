import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class submitQuizInput {
  @Field(() => Number)
  lessonId: number;

  // @Field(() => String)
  // userId: string;

  @Field(() => [AnswersInput])
  userAnswers: AnswersInput[];
}

@InputType()
export class AnswersInput {
  @Field(() => [String])
  answersIds: string[];

  @Field(() => String)
  questionId: string;
}
