import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { S3Service } from '@src/_common/aws/s3/s3.service';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { GqlBooleanResponse } from '@src/_common/graphql/graphql-response.type';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { User } from '@src/user/models/user.model';
import { Sequelize } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { ResourceTypeEnum } from '../enums/course.enum';
import { LessonResourcesType } from '../interfaces/course.type';
import {
  GqlLessonResponse,
  GqlLessonsResponse,
  GqlUserLessonVisitsResponse
} from '../interfaces/lesson.response';
import { Lesson } from '../models/lesson.model';
import { LessonService } from '../services/lesson.service';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { LangEnum, UserRoleEnum } from '@src/user/user.enum';
import { QuizRelatedTypeEnum } from '@src/quiz/enum/quiz.enum';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { DigitalOceanSpacesService } from '@src/_common/digitalocean/services/spaces.service';
import { QuizService } from '@src/quiz/quiz.service';
import { UserQuizAttempt } from '@src/quiz/models/user-quiz-attempts.model';
import { QuizQuestion } from '@src/quiz/models/quiz-question.model';
import { AuthGuard } from '@src/auth/auth.guard';
import {
  GqlQuizQuestionsResponse,
  GqlUserQuizAttemptResponse
} from '@src/quiz/output/quiz.response';
import { submitQuizInput } from '@src/quiz/input/submit-quiz.input';
import { QuizQuestionsPginatedInput } from '@src/quiz/input/get-quiz.input';

@Resolver(() => Lesson)
export class LessonResolver {
  constructor(
    // @Inject(Repositories.QuizzesRepository)
    // private readonly quizRepo: IRepository<Quiz>,
    private readonly lessonService: LessonService,
    private readonly quizService: QuizService,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    // private readonly s3Service: S3Service
    private readonly digitalOceanService: DigitalOceanSpacesService
  ) {}

  // ********************* Queries ********************** //

  @UseGuards(AuthGuard)
  @Query(() => GqlLessonResponse)
  lessonSite(
    @Args('lessonId', { type: () => Int }) lessonId: number,
    @CurrentUser() currentUser: User,
    @Args('userId', { type: () => ID, nullable: true }) userId: string
  ) {
    if (!currentUser && !userId) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }
    return this.lessonService.lessonSite(lessonId, userId || currentUser.id);
  }


  @Query(() => GqlUserLessonVisitsResponse)
  async lastVisitedLessons(
    @CurrentUser() currentUser: User,
  ) {
    if(!currentUser) return null;
    return this.lessonService.lastVisitedLessons(currentUser.id);
  }

  @Query(() => GqlLessonResponse)
  async getQuiz(@Args('lessonId', { type: () => Number }) id: number) {
    return this.quizService.getQuiz(id);
  }

  @Query(() => GqlQuizQuestionsResponse)
  async quizQuestions(@Args('input') input: QuizQuestionsPginatedInput) {
    return this.quizService.getQuizQuestions(input);
  }

  @Query(() => GqlUserQuizAttemptResponse)
  async reviewAnswers(
    @Args('userAttemptId', { type: () => String }) userAttemptId: string
  ) {
    return this.quizService.reviewAnswers(userAttemptId);
  }

  // ******************** Mutations ********************* //

  @Mutation(() => GqlBooleanResponse)
  toggleLessonCompletion(
    @Args('lessonId', { type: () => ID }) lessonId: number,
    @CurrentUser() currentUser: User,
    @Args('userId', { type: () => ID, nullable: true }) userId: string
  ) {
    // Check if userId or currentUser is valid
    if (!userId && !currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }
    const userIdToUse = userId || currentUser.id;

    return this.lessonService.toggleLessonCompletion(userIdToUse, lessonId);
  }

  @Mutation(() => GqlBooleanResponse)
  async enterLesson(
    @Args('lessonId', { type: () => Int }) lessonId: number,
    @CurrentUser() currentUser: User,
    @Args('userId', { type: () => ID, nullable: true }) userId: string
  ) {
    // Check if userId or currentUser is valid
    if (!userId && !currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.sequelize.transaction(async transaction => {
      return await this.lessonService.enterLesson(
        userId || currentUser.id,
        lessonId,
        transaction
      );
    });
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserQuizAttemptResponse)
  async submitQuiz(
    @Args('input') input: submitQuizInput,
    @CurrentUser() user: User
  ) {
    return await this.quizService.submitQuiz(input, user.id);
  }

  // ******************** ResolveFields ********************* //

  @ResolveField(() => Boolean)
  isCompleted(
    @Parent() lesson: Lesson,
    @CurrentUser() currentUser: User,
    @Args('userId', { type: () => ID, nullable: true }) userId?: string
  ) {
    // Check if lesson is valid
    if (!lesson) {
      throw new BaseHttpException(ErrorCodeEnum.LESSON_NOT_FOUND);
    }

    // Check if userId or currentUser is valid
    if (!userId && !currentUser) {
      return false;
    }

    const resolvedUserId = userId || currentUser.id;

    // Call the service to check completion status
    return this.lessonService.isCompletedLesson(resolvedUserId, lesson.id);
  }

  @ResolveField(() => Lesson, { nullable: true })
  nextLesson(@Parent() lesson: Lesson, @CurrentUser() user: User) {
    return this.lessonService.nextLesson(lesson.id, user.id);
  }

  @ResolveField(() => Lesson, { nullable: true })
  previousLesson(@Parent() lesson: Lesson) {
    return this.lessonService.previousLesson(lesson.id);
  }

  @ResolveField(() => [LessonResourcesType], { nullable: true })
  async resources(@Parent() lesson: Lesson): Promise<LessonResourcesType[]> {
    // Ensure that the lesson object and its resources are valid
    if (!lesson || !lesson.resources || !Array.isArray(lesson.resources)) {
      return [];
    }

    // Process the resources
    return Promise.all(
      lesson.resources.map(async resource => {
        if (resource.type === ResourceTypeEnum.ATTACHMENT) {
          try {
            // Generate a presigned URL for attachments
            const downloadUrl =
              await this.digitalOceanService.getPresignedUrlForDownload(
                resource.url
              );
            return { ...resource, downloadUrl }; // Attach the URL
          } catch (error) {
            console.error(
              `Failed to generate presigned URL for resource: ${resource.url}`,
              error
            );
            // Return the resource without the downloadUrl in case of an error
            return resource;
          }
        }
        // Return the resource as-is for non-attachment types
        return resource;
      })
    );
  }

  @ResolveField(() => String, { nullable: true })
  async title(
    @Parent() lesson: Lesson,
    @Context('lang') lang: LangEnum
  ): Promise<string> {
    return lesson[`${lang.toLowerCase()}Title`] ?? lesson.enTitle;
  }

  @ResolveField(() => Boolean, { nullable: true })
  async isAvailable(
    @Parent() lesson: Lesson,
    @CurrentUser() currentUser: User
  ): Promise<boolean> {
    if (!currentUser) {
      return lesson.isPreview;
    }

    const canViewLesson = await this.lessonService.canViewLesson(
      currentUser.id,
      lesson.id
    );

    return canViewLesson || lesson.isPreview;
  }

  @ResolveField(() => String, { nullable: true })
  async videoId(
    @Parent() lesson: Lesson,
    @CurrentUser() currentUser: User
  ): Promise<string> {
    /**
     * check if isPreview is false and the user is not assigned to
     * the lesson course then return null else return the content
     */

    if (!currentUser) {
      if (lesson.isPreview) {
        return lesson.videoId;
      } else {
        return null;
      }
    }

    if (
      currentUser.role === UserRoleEnum.ADMIN ||
      currentUser.role === UserRoleEnum.LECTURER
    ) {
      return lesson.videoId;
    }

    const canViewLesson = await this.lessonService.canViewLesson(
      currentUser.id,
      lesson.id
    );

    if (!canViewLesson && !lesson.isPreview) {
      return null;
    }

    return lesson.videoId;
  }

  @ResolveField(() => String, { nullable: true })
  async content(
    @Parent() lesson: Lesson,
    @CurrentUser() currentUser: User
  ): Promise<string> {
    /**
     * check if isPreview is false and the user is not assigned to
     * the lesson course then return null else return the content
     */

    if (!currentUser) {
      if (lesson.isPreview) {
        return lesson.content;
      } else {
        return null;
      }
    }

    if (
      currentUser.role === UserRoleEnum.ADMIN ||
      currentUser.role === UserRoleEnum.LECTURER
    ) {
      return lesson.content;
    }

    const canViewLesson = await this.lessonService.canViewLesson(
      currentUser.id,
      lesson.id
    );

    if (!canViewLesson && !lesson.isPreview) {
      return null;
    }

    return lesson.content;
  }

  @ResolveField(() => String, { nullable: true })
  async videoUrl(
    @Parent() lesson: Lesson,
    @CurrentUser() currentUser: User
  ): Promise<string> {
    /**
     * check if isPreview is false and the user is not assigned to
     * the lesson course then return null else return the videoUrl
     */

    if (!currentUser) {
      if (lesson.isPreview) {
        return lesson.videoUrl;
      } else {
        return null;
      }
    }

    if (
      currentUser.role === UserRoleEnum.ADMIN ||
      currentUser.role === UserRoleEnum.LECTURER
    ) {
      return lesson.videoUrl;
    }

    const canViewLesson = await this.lessonService.canViewLesson(
      currentUser.id,
      lesson.id
    );

    if (!canViewLesson && !lesson.isPreview) {
      return null;
    }

    return lesson.videoUrl;
  }

  @ResolveField(() => [UserQuizAttempt])
  userAttempts(@Parent() lesson: Lesson, @CurrentUser() user: User) {
    return this.quizService.getUserAttempts(lesson.id, user.id);
  }

  @ResolveField(() => Boolean, { nullable: true })
  canReSubmit(@Parent() lesson: Lesson, @CurrentUser() user: User) {
    if (!lesson || !user) return null;

    return this.quizService.canReSubmit(lesson.id, user.id);
  }

  @ResolveField(() => Int, { nullable: true })
  async availableAttemptsForUser(
    @Parent() lesson: Lesson,
    @CurrentUser() user: User
  ): Promise<number | null> {
    if (!user) return null;

    return this.quizService.availableAttemptsForUser(lesson.id, user.id);
  }

  @ResolveField(() => UserQuizAttempt, { nullable: true })
  async userLastAttempt(
    @Parent() lesson: Lesson,
    @CurrentUser() user: User
  ): Promise<UserQuizAttempt | null> {
    if (!user) return null;

    return await this.quizService.userLastAttempt(lesson.id, user.id);
  }

  @ResolveField(() => Boolean, { nullable: true })
  async isPassed(
    @Parent() lesson: Lesson,
    @CurrentUser() user: User
  ): Promise<boolean | null> {
    if (!user) return null;

    return await this.quizService.isPassed(lesson.id, user.id);
  }
}
