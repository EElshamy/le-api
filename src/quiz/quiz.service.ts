import { Inject, Injectable } from '@nestjs/common';
import {
  CreateQuizInput,
  CreateQuizQuestionInput
} from './input/create-quiz.input';
// import { Quiz } from './models/quiz.model';
import { Repository } from 'sequelize-typescript';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { QuizQuestion } from './models/quiz-question.model';
import { QuizAnswer } from './models/quiz-answer.model';
import { UserQuizAttempt } from './models/user-quiz-attempts.model';
import { UserAnswer } from './models/user-answer.model';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import {
  UpdateQuizInput,
  UpdateQuizQuestionInput
} from './input/update-quiz.input';
import { Op, Sequelize, Transaction } from 'sequelize';
import { submitQuizInput } from './input/submit-quiz.input';
import { User } from '@src/user/models/user.model';
import { QuizQuestionsPginatedInput } from './input/get-quiz.input';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { QuizDurationEnum, QuizRelatedTypeEnum } from './enum/quiz.enum';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Lesson } from '@src/course/models/lesson.model';
import { Section } from '@src/course/models/section.model';
import { LessonTypeEnum } from '@src/course/enums/course.enum';
import { LessonService } from '@src/course/services/lesson.service';
import { UserLessonProgress } from '@src/course/models/user-lesson-progress.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CHECK_COURSE_PROGRESS_EVENT } from '@src/payment/constants/events-tokens.constants';

@Injectable()
export class QuizService {
  constructor(
    // @Inject(Repositories.QuizzesRepository)
    // private readonly quizRepo: IRepository<Quiz>,
    @Inject(Repositories.QuizQuestionsRepository)
    private readonly quizQuestionRepo: IRepository<QuizQuestion>,
    @Inject(Repositories.QuizAnswersRepository)
    private readonly quizAnswerRepo: IRepository<QuizAnswer>,
    @Inject(Repositories.UserAnswersRepository)
    private readonly userAnswerRepo: IRepository<UserAnswer>,
    @Inject(Repositories.UserQuizAttemptsRepository)
    private readonly userQuizAttemptRepo: IRepository<UserQuizAttempt>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomaRepo: IRepository<Diploma>,
    @Inject(Repositories.LessonsRepository)
    private readonly lessonRepo: IRepository<Lesson>,
    @Inject(Repositories.SectionsRepository)
    private readonly sectionRepo: IRepository<Section>,
    @Inject(Repositories.UserLessonProgressRepository)
    private readonly userLessonProgressRepo: IRepository<UserLessonProgress>,
    private readonly eventEmitter: EventEmitter2
  ) {}
  // async createQuiz(
  //   input: CreateQuizInput,
  //   transaction?: Transaction
  // ): Promise<Quiz> {
  //   const { questions, ...quizData } = input;

  //   // 1. Create quiz
  //   const quiz: Quiz = await this.quizRepo.createOne(
  //     { ...quizData },
  //     transaction
  //   );

  //   // 2. Create questions
  //   await Promise.all(
  //     questions.map(async q => {
  //       // 2.1 Validate if there is only one correct answer if question doesn't support multiple answers
  //       if (!q.isMultipleAnswers) {
  //         const correctAnswers = q.answers.filter(a => a.isCorrect);
  //         if (correctAnswers.length > 1) {
  //           throw new BaseHttpException(
  //             ErrorCodeEnum.ONLY_ONE_CORRECT_ANSWER_ALLOWED
  //           );
  //         }
  //       }

  //       const createdQuestion: QuizQuestion =
  //         await this.quizQuestionRepo.createOne(
  //           {
  //             quizId: quiz.id,
  //             enQuestionTitle: q.enQuestionTitle,
  //             arQuestionTitle: q.arQuestionTitle,
  //             isMultipleAnswers: q.isMultipleAnswers,
  //             order: q.order
  //           },
  //           transaction
  //         );

  //       // 3. Create answers for each question
  //       const createdAnswers: QuizAnswer[] =
  //         await this.quizAnswerRepo.bulkCreate(
  //           q.answers.map(answer => ({
  //             questionId: createdQuestion.id,
  //             ...answer
  //           })),
  //           transaction
  //         );

  //       // 3.1 Update numberOfAnswers in question
  //       createdQuestion.numberOfAnswers = createdAnswers.length;
  //       await createdQuestion.save({ transaction });

  //       return createdQuestion;
  //     })
  //   );

  //   // 3.2 Update numberOfQuestions in quiz
  //   quiz.numberOfQuestions = questions.length;
  //   await quiz.save({ transaction });

  //   // 4. Fetch full quiz with questions and answers
  //   const createdQuiz = await this.quizRepo.findOne({ id: quiz.id }, [
  //     {
  //       model: QuizQuestion,
  //       include: [
  //         {
  //           model: QuizAnswer,
  //           as: 'answers'
  //         }
  //       ]
  //     }
  //   ]);

  //   return createdQuiz;
  // }

  async updateQuiz(
    input: {
      lessonId: number;
      passingGrade?: number;
      duration?: number;
      durationType?: QuizDurationEnum;
      attemptsAllowed?: number;
      showCorrectAnswers?: boolean;
      questions?: UpdateQuizQuestionInput[];
    },
    transaction?: Transaction
  ): Promise<Lesson> {
    // Step 0: fetch lesson and validate
    const lesson = await this.lessonRepo.findOne({ id: input.lessonId });
    if (!lesson) {
      throw new BaseHttpException(ErrorCodeEnum.QUIZ_NOT_FOUND);
    }

    // Step 1: update quiz-related fields on lesson
    const lessonUpdatePayload: Partial<Lesson> = {};
    if (typeof input.passingGrade !== 'undefined') {
      lessonUpdatePayload.passingGrade = input.passingGrade;
    }
    if (typeof input.duration !== 'undefined') {
      lessonUpdatePayload.duration = input.duration;
    }
    if (typeof input.durationType !== 'undefined') {
      lessonUpdatePayload.durationType = input.durationType;
    }
    if (typeof input.attemptsAllowed !== 'undefined') {
      lessonUpdatePayload.attemptsAllowed = input.attemptsAllowed;
    }
    if (typeof input.showCorrectAnswers !== 'undefined') {
      lessonUpdatePayload.showCorrectAnswers = input.showCorrectAnswers;
    }

    if (Object.keys(lessonUpdatePayload).length > 0) {
      await this.lessonRepo.updateOne(
        { id: lesson.id },
        lessonUpdatePayload,
        transaction
      );
    }

    // Step 2: handle questions if provided
    if (input.questions && input.questions.length > 0) {
      const existingQuestions = await this.quizQuestionRepo.findAll(
        { lessonId: lesson.id },
        [{ model: QuizAnswer, as: 'answers' }]
      );

      const existingQuestionIds = existingQuestions.map(q => q.id);
      const incomingQuestionIds = input.questions
        .filter(q => q.id)
        .map(q => q.id);

      // 2.1 Delete removed questions
      const questionsToDelete = existingQuestionIds.filter(
        id => !incomingQuestionIds.includes(id)
      );
      if (questionsToDelete.length > 0) {
        await this.quizQuestionRepo.deleteAll(
          { id: { [Op.in]: questionsToDelete } },
          transaction
        );
      }

      // 2.2 Upsert questions
      for (const qInput of input.questions) {
        // validate multiple/correct answers constraints (you might also have validated this earlier)
        const correctAnswersCount = (qInput.answers ?? []).filter(
          a => a.isCorrect
        ).length;
        if (!qInput.isMultipleAnswers && correctAnswersCount > 1) {
          throw new BaseHttpException(
            ErrorCodeEnum.ONLY_ONE_CORRECT_ANSWER_ALLOWED
          );
        }
        if (qInput.isMultipleAnswers && correctAnswersCount < 2) {
          throw new BaseHttpException(
            ErrorCodeEnum.MULTIPLE_ANSWERS_REQUIRE_AT_LEAST_TWO_CORRECT
          );
        }

        if (qInput.id) {
          // Update existing question
          const existingQ = existingQuestions.find(q => q.id === qInput.id);
          if (!existingQ) continue; // or throw

          await this.quizQuestionRepo.updateOne(
            { id: existingQ.id },
            {
              enQuestionTitle: qInput.enQuestionTitle,
              arQuestionTitle: qInput.arQuestionTitle,
              isMultipleAnswers: qInput.isMultipleAnswers,
              ...(typeof qInput.order !== 'undefined' ?
                { order: qInput.order }
              : {})
            },
            transaction
          );

          const existingAnswers = existingQ.answers || [];
          const existingAnswerIds = existingAnswers.map(a => a.id);
          const incomingAnswerIds = (qInput.answers ?? [])
            .filter(a => a.id)
            .map(a => a.id);

          // Delete removed answers
          const answersToDelete = existingAnswerIds.filter(
            id => !incomingAnswerIds.includes(id)
          );
          if (answersToDelete.length > 0) {
            await this.quizAnswerRepo.deleteAll(
              { id: { [Op.in]: answersToDelete } },
              transaction
            );
          }

          // Update or create answers
          for (const aInput of qInput.answers ?? []) {
            if (aInput.id) {
              const existingA = existingAnswers.find(a => a.id === aInput.id);
              if (existingA) {
                await this.quizAnswerRepo.updateOne(
                  { id: existingA.id },
                  {
                    enAnswerTitle: aInput.enAnswerTitle,
                    arAnswerTitle: aInput.arAnswerTitle,
                    isCorrect: !!aInput.isCorrect
                  },
                  transaction
                );
              }
            } else {
              await this.quizAnswerRepo.createOne(
                {
                  questionId: existingQ.id,
                  enAnswerTitle: aInput.enAnswerTitle,
                  arAnswerTitle: aInput.arAnswerTitle,
                  isCorrect: !!aInput.isCorrect
                },
                transaction
              );
            }
          }

          // update numberOfAnswers
          await this.quizQuestionRepo.updateOne(
            { id: existingQ.id },
            { numberOfAnswers: (qInput.answers ?? []).length },
            transaction
          );
        } else {
          // Create new question + answers (include order)
          const createdQ = await this.quizQuestionRepo.createOne(
            {
              lessonId: lesson.id,
              enQuestionTitle: qInput.enQuestionTitle,
              arQuestionTitle: qInput.arQuestionTitle,
              isMultipleAnswers: qInput.isMultipleAnswers,
              ...(typeof qInput.order !== 'undefined' ?
                { order: qInput.order }
              : {})
            },
            transaction
          );

          const createdAnswers = await Promise.all(
            (qInput.answers ?? []).map(a =>
              this.quizAnswerRepo.createOne(
                {
                  questionId: createdQ.id,
                  enAnswerTitle: a.enAnswerTitle,
                  arAnswerTitle: a.arAnswerTitle,
                  isCorrect: !!a.isCorrect
                },
                transaction
              )
            )
          );

          await this.quizQuestionRepo.updateOne(
            { id: createdQ.id },
            { numberOfAnswers: createdAnswers.length },
            transaction
          );
        }
      } // end for questions

      // Update numberOfQuestions on lesson
      await this.lessonRepo.updateOne(
        { id: lesson.id },
        { numberOfQuestions: input.questions.length },
        transaction
      );
    } // end if questions

    // Return updated lesson with nested questions + answers
    const updatedLesson = await this.lessonRepo.findOne({ id: lesson.id }, [
      { model: QuizQuestion, include: [{ model: QuizAnswer, as: 'answers' }] }
    ]);

    return updatedLesson;
  }

  async createQuizForLesson(
    input: {
      lessonId: number;
      passingGrade: number;
      duration: number;
      durationType: QuizDurationEnum;
      attemptsAllowed: number;
      showCorrectAnswers?: boolean;
      questions: CreateQuizQuestionInput[];
    },
    transaction?: Transaction
  ) {
    const { lessonId, questions, ...quizData } = input;

    await this.lessonRepo.updateOne(
      { id: lessonId },
      { ...quizData, numberOfQuestions: questions.length },
      transaction
    );

    await Promise.all(
      questions.map(async q => {
        if (!q.isMultipleAnswers) {
          const correctAnswers = q.answers.filter(a => a.isCorrect);
          if (correctAnswers.length > 1) {
            throw new BaseHttpException(
              ErrorCodeEnum.ONLY_ONE_CORRECT_ANSWER_ALLOWED
            );
          }
        }

        const createdQuestion: QuizQuestion =
          await this.quizQuestionRepo.createOne(
            {
              lessonId,
              enQuestionTitle: q.enQuestionTitle,
              arQuestionTitle: q.arQuestionTitle,
              isMultipleAnswers: q.isMultipleAnswers,
              order: q.order
            },
            transaction
          );

        const createdAnswers: QuizAnswer[] =
          await this.quizAnswerRepo.bulkCreate(
            q.answers.map(answer => ({
              questionId: createdQuestion.id,
              enAnswerTitle: answer.enAnswerTitle,
              arAnswerTitle: answer.arAnswerTitle,
              isCorrect: answer.isCorrect ?? false
            })),
            transaction
          );

        createdQuestion.numberOfAnswers = createdAnswers.length;
        await createdQuestion.save({ transaction });

        return createdQuestion;
      })
    );

    return this.lessonRepo.findOne(
      { id: lessonId },
      [
        {
          model: QuizQuestion,
          include: [{ model: QuizAnswer, as: 'answers' }]
        }
      ],
      [],
      []
    );
  }

  findAll() {
    return `This action returns all quiz`;
  }

  async getQuiz(id: number) {
    // Step 1: Find the quiz
    const quizLesson = await this.lessonRepo.findOne(
      { id, type: LessonTypeEnum.QUIZ },
      [
        {
          model: QuizQuestion,
          as: 'questions',
          include: [{ model: QuizAnswer, as: 'answers' }]
        }
      ]
    );

    // Step 2: If quiz not found, throw exception
    if (!quizLesson) {
      throw new BaseHttpException(ErrorCodeEnum.QUIZ_NOT_FOUND);
    }

    // Step 3: Return quiz with nested questions and answers
    return quizLesson;
  }

  async submitQuiz(
    input: submitQuizInput,
    userId: string,
    transaction?: Transaction
  ) {
    const { lessonId, userAnswers } = input;

    // 1. Check that the lesson exists and is of type QUIZ
    const quizLesson = await this.lessonRepo.findOne(
      { id: lessonId, type: LessonTypeEnum.QUIZ },
      [
        {
          model: QuizQuestion,
          as: 'questions',
          include: [{ model: QuizAnswer, as: 'answers' }]
        }
      ]
    );

    if (!quizLesson) {
      throw new BaseHttpException(ErrorCodeEnum.QUIZ_NOT_FOUND);
    }

    // 2. Check that the user exists
    const user = await this.userRepo.findOne({ id: userId });
    if (!user) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    // 3. Check attempts limit
    const userAttempts = await this.userQuizAttemptRepo.findAll({
      userId,
      lessonId: quizLesson.id
    });

    if (
      quizLesson.attemptsAllowed &&
      userAttempts.length >= quizLesson.attemptsAllowed
    ) {
      throw new BaseHttpException(ErrorCodeEnum.MAX_ATTEMPTS_REACHED);
    }

    // 4. Create attempt
    const userAttempt = await this.userQuizAttemptRepo.createOne(
      {
        userId: user.id,
        lessonId: quizLesson.id
      },
      transaction
    );

    let correctAnswers = 0;
    let wrongAnswers = 0;

    // 5. Evaluate answers
    for (const question of quizLesson.questions) {
      const correctAnswerIds = question.answers
        .filter(a => a.isCorrect)
        .map(a => a.id);

      const userAnswer = userAnswers.find(a => a.questionId === question.id);

      if (
        !userAnswer ||
        !userAnswer.answersIds ||
        !userAnswer.answersIds.length
      ) {
        await this.userAnswerRepo.createOne(
          {
            attemptId: userAttempt.id,
            questionId: question.id,
            isCorrect: false
          },
          transaction
        );
        wrongAnswers++;
        continue;
      }

      const userAnswerIds = userAnswer.answersIds;

      // Validate that all provided answerIds belong to this question
      const validAnswerIds = question.answers.map(a => a.id);
      const invalidAnswerIds = userAnswerIds.filter(
        id => !validAnswerIds.includes(id)
      );
      if (invalidAnswerIds.length) {
        throw new BaseHttpException(ErrorCodeEnum.INVALID_ANSWERS);
      }

      // Compare
      const isAllCorrect =
        correctAnswerIds.length === userAnswerIds.length &&
        correctAnswerIds.every(id => userAnswerIds.includes(id));

      const userAnswerRecord = await this.userAnswerRepo.createOne(
        {
          attemptId: userAttempt.id,
          questionId: question.id,
          isCorrect: isAllCorrect
        },
        transaction
      );

      await userAnswerRecord.$set('answers', userAnswerIds, { transaction });

      if (isAllCorrect) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    }

    // 6. Score
    const score =
      quizLesson.numberOfQuestions > 0 ?
        (correctAnswers / quizLesson.numberOfQuestions) * 100
      : 0;

    const isPassed = score >= quizLesson.passingGrade;

    // 7. Update lesson progress
    if (isPassed) {
      const userLessonProgress = await this.getLessonProgress(userId, lessonId);

      await this.updateLessonProgress(userLessonProgress, true);

      this.eventEmitter.emitAsync(CHECK_COURSE_PROGRESS_EVENT, {
        userId,
        lessonId
      });
    }

    // 8. Update attempt
    await this.userQuizAttemptRepo.updateOne(
      { id: userAttempt.id },
      {
        isPassed,
        score,
        numberOfCorrectAnswers: correctAnswers,
        numberOfWrongAnswers: wrongAnswers
      },
      transaction
    );

    // 8. Return updated attempt
    return this.userQuizAttemptRepo.findOne({ id: userAttempt.id }, [
      {
        model: UserAnswer,
        include: [
          {
            model: QuizAnswer,
            as: 'answers',
            include: [{ model: QuizQuestion }]
          }
        ]
      },
      { model: User },
      { model: Lesson }
    ]);
  }

  async getQuizQuestions(input: QuizQuestionsPginatedInput) {
    const { lessonId, page, limit } = input;
    const questions = await this.quizQuestionRepo.findPaginated(
      { lessonId },
      [],
      page,
      limit,
      [
        {
          model: QuizAnswer,
          as: 'answers'
        }
      ]
    );
    return questions;
  }

  async questionCorrectAnswers(questionId: string) {
    return await this.quizAnswerRepo.findAll({ questionId, isCorrect: true });
  }

  async getUserAttempts(lessonId: number, userId: string) {
    return await this.userQuizAttemptRepo.findAll(
      { lessonId, userId },
      [
        {
          model: UserAnswer,
          include: [
            {
              model: QuizAnswer,
              include: [{ model: QuizQuestion }]
            }
          ]
        }
      ],
      [[Sequelize.col('createdAt'), SortTypeEnum.DESC]]
    );
  }
  async reviewAnswers(userAttemptId: string) {
    return await this.userQuizAttemptRepo.findOne({ id: userAttemptId }, [
      {
        model: UserAnswer,
        include: [
          {
            model: QuizAnswer,
            include: [{ model: QuizQuestion }]
          },
          {
            model: QuizQuestion
          }
        ]
      }
    ]);
  }

  async canReSubmit(lessonId: number, userId: string) {
    const userAttempts = await this.userQuizAttemptRepo.findAll({
      userId,
      lessonId
    });

    const quizLesson = await this.lessonRepo.findOne({
      id: lessonId
    });
    if (!quizLesson) return null;

    if (
      quizLesson.attemptsAllowed &&
      userAttempts.length >= quizLesson.attemptsAllowed
    ) {
      return false;
    }
    return true;
  }

  // async validateQuizRelatedModels(quizData: Partial<Quiz>) {
  //   const repositories = {
  //     [QuizRelatedTypeEnum.COURSE]: this.courseRepo,
  //     [QuizRelatedTypeEnum.LESSON]: this.lessonRepo,
  //     [QuizRelatedTypeEnum.SECTION]: this.sectionRepo,
  //     [QuizRelatedTypeEnum.DIPLOMA]: this.diplomaRepo
  //   };

  //   const errorCodes = {
  //     [QuizRelatedTypeEnum.COURSE]: ErrorCodeEnum.COURSE_DOESNT_EXIST,
  //     [QuizRelatedTypeEnum.LESSON]: ErrorCodeEnum.LESSON_NOT_FOUND,
  //     [QuizRelatedTypeEnum.SECTION]: ErrorCodeEnum.SECTION_NOT_FOUND,
  //     [QuizRelatedTypeEnum.DIPLOMA]: ErrorCodeEnum.DIPLOMA_DOESNT_EXIST
  //   };

  //   const repository = repositories[quizData.relatedType];
  //   const errorCode = errorCodes[quizData.relatedType];

  //   if (repository) {
  //     const entity = await repository.findOne({
  //       id:
  //         (
  //           quizData.relatedType === QuizRelatedTypeEnum.SECTION ||
  //           quizData.relatedType === QuizRelatedTypeEnum.COURSE ||
  //           quizData.relatedType === QuizRelatedTypeEnum.DIPLOMA
  //         ) ?
  //           quizData.relatedId
  //         : Number(quizData.relatedId) // For lesson
  //     });

  //     if (!entity) {
  //       throw new BaseHttpException(errorCode);
  //     }
  //   }

  //   return true;
  // }

  async availableAttemptsForUser(
    lessonId: number,
    userId: string
  ): Promise<number | null> {
    const userQuizAttempts = (
      await this.userQuizAttemptRepo.findAll({
        userId,
        lessonId
      })
    ).length;
    const quizLesson = await this.lessonRepo.findOne({ id: lessonId });

    if (quizLesson.attemptsAllowed) {
      const remainingAttempts = quizLesson.attemptsAllowed - userQuizAttempts;
      return remainingAttempts > 0 ? remainingAttempts : 0;
    }

    return null;
  }

  async userLastAttempt(lessonId: number, userId: string) {
    const userAttempts = await this.userQuizAttemptRepo.findAll(
      {
        userId,
        lessonId
      },
      [
        {
          model: UserAnswer,
          include: [
            {
              model: QuizAnswer,
              include: [{ model: QuizQuestion }]
            },
            {
              model: QuizQuestion
            }
          ]
        }
      ],
      [[Sequelize.col('createdAt'), SortTypeEnum.DESC]]
    );
    return userAttempts[0];
  }

  async isPassed(lessonId: number, userId: string): Promise<boolean> {
    const passedAttempt = await this.userQuizAttemptRepo.findOne({
      userId,
      lessonId,
      isPassed: true
    });
    return !!passedAttempt;
  }

  async getLessonProgress(userId: string, lessonId: number) {
    return this.userLessonProgressRepo.findOne(
      {
        userId,
        lessonId
      },
      [
        {
          model: Lesson,
          include: [
            {
              model: Section,
              attributes: ['id', 'courseId'],
              include: [{ model: Course, attributes: ['id'] }]
            }
          ]
        }
      ]
    );
  }

  // Update existing lesson progress
  async updateLessonProgress(
    lessonProgress: UserLessonProgress,
    markCompleted?: boolean
  ) {
    return this.userLessonProgressRepo.updateOneFromExistingModel(
      lessonProgress,
      { completed: markCompleted }
    );
  }

  // async updateUserCourseProgressByLesson(
  //   userId: string,
  //   lessonId: number
  // ): Promise<void> {
  //   // 1. Get courseId from lesson's section
  //   let courseId = (
  //     await this.lessonRepo.findOne(
  //       {
  //         id: lessonId
  //       },
  //       [
  //         {
  //           model: Section
  //         }
  //       ]
  //     )
  //   )?.section?.courseId;

  //   if (!courseId) {
  //     const lesson = await this.lessonRepo.findOne(
  //       {
  //         id: lessonId
  //       },
  //       [
  //         {
  //           model: Section,
  //           include: [
  //             {
  //               model: Course
  //             }
  //           ]
  //         }
  //       ]
  //     );

  //     if (!lesson) {
  //       throw new BaseHttpException(ErrorCodeEnum.LESSON_NOT_FOUND);
  //     }

  //     courseId = lesson.section.courseId;
  //   }

  //   // 2. Calculate number of completed lessons
  //   const numberOfCompletedLessons = await this.getCompletedLessonsCount(
  //     userId,
  //     courseId
  //   );

  //   // 3. Update user course progress
  //   await this.updateUserAssignedCourse(
  //     userId,
  //     courseId,
  //     numberOfCompletedLessons
  //   );

  //   // 4. Check course completion status
  //   const { completedLessons, totalLessons } =
  //     await this.userService.getUserCourseProgress(userId, courseId);

  //   if (completedLessons === totalLessons) {
  //     await this.courseService.markCourseAsCompleted(courseId, userId);
  //   } else {
  //     await this.courseService.markCourseAsNotCompleted(courseId, userId);
  //   }
  // }
}
