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
// import { Quiz } from '../models/quiz.model';
import { CreateQuizInput } from '../input/create-quiz.input';
import {
  SEQUELIZE_INSTANCE_NEST_DI_TOKEN,
  Transactional
} from 'sequelize-transactional-typescript';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@src/auth/auth.guard';
import { LangEnum, UserRoleEnum } from '@src/user/user.enum';
import { HasRole } from '@src/auth/auth.metadata';
import { UpdateQuizInput } from '../input/update-quiz.input';
import { submitQuizInput } from '../input/submit-quiz.input';
import { QuizQuestionsPginatedInput } from '../input/get-quiz.input';
import { UserQuizAttempt } from '../models/user-quiz-attempts.model';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { User } from '@src/user/models/user.model';
import {
  GqlQuizQuestionsResponse,
  // GqlQuizResponse,
  GqlUserQuizAttemptResponse
} from '../output/quiz.response';
import { GqlBooleanResponse } from '@src/_common/graphql/graphql-response.type';
import { Lesson } from '@src/course/models/lesson.model';
import { GqlLessonResponse } from '@src/course/interfaces/lesson.response';

@Resolver(() => Lesson)
export class QuizResolver {
  constructor(private readonly quizService: QuizService) {}
  // ################################### MUTATIONS ###################################
  // @Transactional()
  // @UseGuards(AuthGuard)
  // @HasRole(UserRoleEnum.ADMIN)
  // @Mutation(() => GqlQuizResponse)
  // async createQuiz(@Args('input') input: CreateQuizInput) {
  //   return await this.quizService.createQuiz(input);
  // }

  // @Transactional()
  // @UseGuards(AuthGuard)
  // @HasRole(UserRoleEnum.ADMIN)
  // @Mutation(() => GqlQuizResponse)
  // async updateQuiz(@Args('input') input: UpdateQuizInput): Promise<Quiz> {
  //   return await this.quizService.updateQuiz(input);
  // }

  // @UseGuards(AuthGuard)
  // @HasRole(UserRoleEnum.ADMIN)
  // @Mutation(() => GqlBooleanResponse)
  // async deleteQuiz(@Args('id', { type: () => String }) id: string) {
  //   return await this.quizService.deleteQuiz(id);
  // }

  // @UseGuards(AuthGuard)
  // @Mutation(() => GqlUserQuizAttemptResponse)
  // async submitQuiz(
  //   @Args('input') input: submitQuizInput,
  //   @CurrentUser() user: User
  // ) {
  //   return await this.quizService.submitQuiz(input, user.id);
  // }

  // ################################### QUERIES ###################################

  // @Query(() => GqlLessonResponse)
  // async getQuiz(@Args('lessonId', { type: () => Number }) id: number) {
  //   return this.quizService.getQuiz(id);
  // }

  // @Query(() => GqlQuizQuestionsResponse)
  // async quizQuestions(@Args('input') input: QuizQuestionsPginatedInput) {
  //   return this.quizService.getQuizQuestions(input);
  // }

  // @Query(() => GqlUserQuizAttemptResponse)
  // async reviewAnswers(
  //   @Args('userAttemptId', { type: () => String }) userAttemptId: string
  // ) {
  //   return this.quizService.reviewAnswers(userAttemptId);
  // }

  // ################################### RESOLVE_FIELDS ###################################

  // @ResolveField(() => [UserQuizAttempt])
  // userAttempts(@Parent() lesson: Lesson, @CurrentUser() user: User) {
  //   return this.quizService.getUserAttempts(lesson.id, user.id);
  // }

  // @ResolveField(() => Boolean, { nullable: true })
  // canReSubmit(@Parent() lesson: Lesson, @CurrentUser() user: User) {
  //   if (!lesson || !user) return null;

  //   return this.quizService.canReSubmit(lesson.id, user.id);
  // }

  // @ResolveField(() => Int, { nullable: true })
  // async availableAttemptsForUser(
  //   @Parent() lesson: Lesson,
  //   @CurrentUser() user: User
  // ): Promise<number | null> {
  //   if (!user) return null;

  //   return this.quizService.availableAttemptsForUser(lesson.id, user.id);
  // }

  // @ResolveField(() => UserQuizAttempt, { nullable: true })
  // async userLastAttempt(
  //   @Parent() lesson: Lesson,
  //   @CurrentUser() user: User
  // ): Promise<UserQuizAttempt | null> {
  //   if (!user) return null;

  //   return await this.quizService.userLastAttempt(lesson.id, user.id);
  // }

  // @ResolveField(() => Boolean, { nullable: true })
  // async isPassed(
  //   @Parent() lesson: Lesson,
  //   @CurrentUser() user: User
  // ): Promise<boolean | null> {
  //   if (!user) return null;

  //   return await this.quizService.isPassed(lesson.id, user.id);
  // }

  // @ResolveField(() => String)
  // localizedTitle(@Parent() quiz : Quiz, @Context('lang') lang: LangEnum) {
  //   return quiz[`${lang.toLowerCase()}Title`] ?? quiz.enTitle;
  // }
}
