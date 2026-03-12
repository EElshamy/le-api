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
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { User } from '@src/user/models/user.model';
import { LangEnum, UserRoleEnum } from '@src/user/user.enum';

@Resolver(() => QuizAnswer)
export class QuizAnswerResolver {
  constructor(private readonly quizService: QuizService) {}
  // ################################### RESOLVE_FIELDS ###################################

  @ResolveField(() => Boolean, { nullable: true })
  async isCorrect(@Parent() quizAnswer: QuizAnswer, @CurrentUser() user: User) {
    if (user?.role !== UserRoleEnum.ADMIN) {
      return null;
    }

    return quizAnswer?.isCorrect;
  }

  @ResolveField(() => String)
  localizedAnswerTitle(
    @Parent() quizAnswer: QuizAnswer,
    @Context('lang') lang: LangEnum
  ) {
    return (
      quizAnswer[`${lang.toLowerCase()}AnswerTitle`] ??
      quizAnswer.enAnswerTitle
    );
  }
}
