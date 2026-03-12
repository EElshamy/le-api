import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class QuizQuestionsPginatedInput {
  @Field(() => String)
  lessonId: string;

  @Field(() => Number, { nullable: true, defaultValue: 1 })
  limit?: number;

  @Field(() => Number, { nullable: true, defaultValue: 1 })
  page?: number;
}
