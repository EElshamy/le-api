import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizResolver } from './resolvers/quiz.resolver';
import { QuizQuestionResolver } from './resolvers/quiz-questions.resolver';
import { QuizAnswerResolver } from './resolvers/quiz-answers.resolver';

@Module({
  imports: [],
  providers: [
    QuizResolver,
    QuizQuestionResolver,
    QuizAnswerResolver,
    QuizService
  ],
  exports: [QuizService]
})
export class QuizModule {}
