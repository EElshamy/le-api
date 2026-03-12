import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField,
  Parent,
  Context
} from '@nestjs/graphql';
import { QuizService } from '../quiz.service';
import { QuizQuestion } from '../models/quiz-question.model';
import { QuizAnswer } from '../models/quiz-answer.model';
import { LangEnum, UserRoleEnum } from '@src/user/user.enum';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { User } from '@src/user/models/user.model';
import { Inject } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { UserQuizAttempt } from '../models/user-quiz-attempts.model';

@Resolver(() => QuizQuestion)
export class QuizQuestionResolver {
  constructor(
    private readonly quizService: QuizService,
    @Inject(Repositories.UserQuizAttemptsRepository)
    private readonly userQuizAttemptRepo: IRepository<UserQuizAttempt>
  ) {}
  // ################################### RESOLVE_FIELDS ###################################

  @ResolveField(() => [QuizAnswer], { nullable: true })
  async correctAnswers(
    @Parent() question: QuizQuestion,
    @CurrentUser() user: User
  ) {
    const quiz = await this.quizService.getQuiz(question.lessonId);

    const userAttempts = await this.userQuizAttemptRepo.findAll({
      userId: user.id,
      lessonId: question.lessonId
    });

    if (user?.role === UserRoleEnum.ADMIN) {
      return this.quizService.questionCorrectAnswers(question.id);
    }

    if (quiz.showCorrectAnswers && userAttempts.length > 0) {
      return this.quizService.questionCorrectAnswers(question.id);
    }

    return null;
  }

  @ResolveField(() => String)
  localizedQuestionTitle(
    @Parent() quizQuestion: QuizQuestion,
    @Context('lang') lang: LangEnum
  ) {
    return (
      quizQuestion[`${lang.toLowerCase()}QuestionTitle`] ??
      quizQuestion.enQuestionTitle
    );
  }
}
