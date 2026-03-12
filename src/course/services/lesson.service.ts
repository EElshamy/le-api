import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { User } from '@src/user/models/user.model';
import { col, Op, QueryTypes, Sequelize, Transaction } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { Course } from '../models/course.model';
import { Lesson } from '../models/lesson.model';
import { Section } from '../models/section.model';
import { UsersAssignment } from '../models/user-assignments.model';
import { UserLessonProgress } from '../models/user-lesson-progress.model';
import { CourseService } from './course.service';
import { UserService } from '@src/user/services/user.service';
import { QuizRelatedTypeEnum } from '@src/quiz/enum/quiz.enum';
import { UserQuizAttempt } from '@src/quiz/models/user-quiz-attempts.model';
import { LessonTypeEnum } from '../enums/course.enum';
import { QuizQuestion } from '@src/quiz/models/quiz-question.model';
import { QuizAnswer } from '@src/quiz/models/quiz-answer.model';
import { UserRoleEnum } from '@src/user/user.enum';
import { OnEvent } from '@nestjs/event-emitter';
import { CHECK_COURSE_PROGRESS_EVENT } from '@src/payment/constants/events-tokens.constants';
import { UserLessonVisit } from '../models/user-lesson-visit.model';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { REGISTER_USER_VIEW_JOB } from '../processors/user-views.processor';

@Injectable()
export class LessonService {
  constructor(
    @Inject(Repositories.LessonsRepository)
    private readonly lessonRepo: IRepository<Lesson>,
    @Inject(Repositories.UserLessonProgressRepository)
    private readonly userLessonProgressRepo: IRepository<UserLessonProgress>,
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly userAssignmentsRepo: IRepository<UsersAssignment>,
    @Inject(Repositories.SectionsRepository)
    private readonly sectionRepo: IRepository<Section>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(Repositories.UserQuizAttemptsRepository)
    private readonly userQuizAttemptRepo: IRepository<UserQuizAttempt>,
    @Inject(Repositories.UserLessonVisitsRepository)
    private readonly userLessonVisitRepo: IRepository<UserLessonVisit>,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    private readonly courseService: CourseService,
    private readonly userService: UserService,
    @InjectQueue('userViews')
    private readonly userViewsQueue: Queue
  ) {}
  async toggleLessonCompletion(
    userId: string,
    lessonId: number
  ): Promise<boolean> {
    // 1. Check if the lesson exists
    const foundLesson = await this.lessonRepo.findOne({ id: lessonId });
    if (!foundLesson) {
      throw new BaseHttpException(ErrorCodeEnum.LESSON_NOT_FOUND);
    }

    // 2. Check if the lesson is a quiz
    if (foundLesson.type === LessonTypeEnum.QUIZ) {
      throw new BaseHttpException(ErrorCodeEnum.CANNOT_TOGGLE_QUIZ_COMPLETION);
    }

    // 2. Retrieve existing progress or create a new one
    const lessonProgress = await this.getLessonProgress(userId, lessonId);
    let lesson: UserLessonProgress;

    if (lessonProgress) {
      if (lessonProgress.completed) {
        // User wants to toggle to not completed
        lesson = await this.updateLessonProgress(lessonProgress, false);
      } else {
        // Check if user is allowed to complete the lesson
        const canView = await this.canViewLesson(userId, lessonId);
        if (!canView) {
          throw new BaseHttpException(ErrorCodeEnum.LESSON_ORDER_ENFORCED);
        }
        lesson = await this.updateLessonProgress(lessonProgress, true);
      }
    } else {
      // Check if user is allowed to complete the lesson
      const canView = await this.canViewLesson(userId, lessonId);
      if (!canView) {
        throw new BaseHttpException(ErrorCodeEnum.LESSON_ORDER_ENFORCED);
      }
      lesson = await this.createLessonProgress(userId, lessonId);
    }

    // 3. Update user course progress
    await this.updateUserCourseProgressByLesson({
      userId,
      lessonId
    });

    // // 3. Get the courseId from the lesson's section
    // let courseId = lesson.lesson?.section?.courseId;
    // if (!courseId) {
    //   const lesson = await this.lessonRepo.findOne({ id: lessonId }, [
    //     {
    //       model: Section,
    //       attributes: ['courseId'],
    //       include: [{ model: Course, attributes: ['id'] }]
    //     }
    //   ]);

    //   if (!lesson) {
    //     throw new BaseHttpException(ErrorCodeEnum.LESSON_NOT_FOUND);
    //   }

    //   courseId = lesson.section.courseId;
    // }

    // // 4. Calculate number of completed lessons
    // const numberOfCompletedLessons = await this.getCompletedLessonsCount(
    //   userId,
    //   courseId
    // );

    // // 5. Update user course progress
    // await this.updateUserAssignedCourse(
    //   userId,
    //   courseId,
    //   numberOfCompletedLessons
    // );

    // // 6. Mark course as completed if all lessons are finished
    // const { completedLessons, totalLessons } =
    //   await this.userService.getUserCourseProgress(userId, courseId);

    // if (completedLessons === totalLessons) {
    //   await this.courseService.markCourseAsCompleted(courseId, userId);
    // } else {
    //   await this.courseService.markCourseAsNotCompleted(courseId, userId);
    // }

    return lesson.completed;
  }

  // Helper functions

  // Fetch lesson progress for the user and lesson
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

  // Create a new lesson progress entry
  async createLessonProgress(userId: string, lessonId: number) {
    return this.userLessonProgressRepo.createOne({
      userId,
      lessonId,
      completed: true
    });
  }

  // Get the count of completed lessons for the user in the course
  async getCompletedLessonsCount(userId: string, courseId: string) {
    const courseSectionsIds = await this.sectionRepo.findAll(
      { courseId: courseId },
      [],
      [],
      ['id']
    );
    const sectionsLessons = await this.lessonRepo.findAll(
      { sectionId: { [Op.in]: courseSectionsIds.map(section => section.id) } },
      [],
      [],
      ['id']
    );
    const numberOfCompletedLessons = await this.userLessonProgressRepo.findAll({
      userId,
      lessonId: { [Op.in]: sectionsLessons.map(lesson => lesson.id) },
      completed: true
    });
    return numberOfCompletedLessons.length;
  }

  // Update the UserAssignedCourse record
  async updateUserAssignedCourse(
    userId: string,
    courseId: string,
    completedLessonsCount: number
  ) {
    await this.userAssignmentsRepo.updateAll(
      {
        userId,
        courseId
      },
      { completedLessons: completedLessonsCount }
    );

    // const userAssignedCourses = await this.userAssignmentsRepo.findAll({
    //   userId,
    //   courseId
    // });

    // if (!userAssignedCourses) {
    //   throw new BaseHttpException(ErrorCodeEnum.COURSE_NOT_ASSIGNED_TO_USER);
    // }

    // userAssignedCourses.map(async userAssignedCourse => {
    //   userAssignedCourse.completedLessons = completedLessonsCount;
    //   await userAssignedCourse.save();
    // });
  }

  async enterLesson(
    userId: string,
    lessonId: number,
    transaction: Transaction
  ): Promise<Lesson> {
    const user = await this.userRepo.findOne({
      id: userId,
      isDeleted: false,
      isBlocked: false
    });

    if (!user) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    // Fetch the lesson with its associated section and course
    const lesson = await this.lessonRepo.findOne(
      { id: lessonId },
      [
        {
          model: Section,
          include: [
            {
              model: Course,
              include: [
                {
                  model: UsersAssignment,
                  where: { userId },
                  required: true
                }
              ]
            }
          ]
        },
        {
          model: QuizQuestion,
          include: [{ model: QuizAnswer }]
        }
      ],
      null,
      null,
      transaction
    );

    if (
      !lesson?.section?.course?.userAssignedCourses.length &&
      user.role !== UserRoleEnum.ADMIN
    ) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_NOT_ASSIGNED_TO_USER);
    }

    if (!lesson) {
      throw new BaseHttpException(ErrorCodeEnum.LESSON_NOT_FOUND);
    }

    // Fetch or create UserLessonProgress
    let lessonProgress = await this.userLessonProgressRepo.findOne(
      {
        userId,
        lessonId
      },
      [],
      null,
      null,
      transaction
    );

    if (!lessonProgress) {
      // Create progress if none exists
      lessonProgress = await this.userLessonProgressRepo.createOne(
        {
          userId,
          lessonId
        },
        transaction
      );
    } else {
      // Update progress timestamp
      lessonProgress.changed('updatedAt', true);
      await lessonProgress.save({ transaction });
    }

    return lesson;
  }

  async getCompletedLessons(userId: string, courseId: string): Promise<number> {
    const lessons = await this.lessonRepo.findAll({}, [
      {
        model: Section,
        where: { courseId }
      },
      {
        model: UserLessonProgress,
        where: { userId, completed: true }
      }
    ]);

    return lessons.length;
  }

  async isCompletedLesson(userId: string, lessonId: number) {
    const lesson = await this.userLessonProgressRepo.findOne({
      lessonId,
      userId
    });

    return !!lesson?.completed;
  }

  async getLastAccessedLesson(
    courseId: string,
    userId: string,
    currentUser: User
  ) {
    const userCourse = await this.courseRepo.findOne(
      {
        id: courseId
      },
      [{ model: Section, include: [Lesson] }]
    );

    const lessonsIds = userCourse?.courseSections
      .map(section => section?.lessons?.map(lesson => lesson?.id))
      .flatMap(id => id);

    const lastLessonProgress = await this.userLessonProgressRepo.findOne(
      {
        userId: currentUser?.id || userId,
        lessonId: {
          [Op.in]: lessonsIds
        }
      },
      [Lesson],
      [['updatedAt', 'DESC']]
    );

    return lastLessonProgress?.lesson;
  }

  async lessonSite(lessonId: number, userId: string): Promise<Lesson> {
    return this.sequelize.transaction(async transaction => {
      // 1️) Check lesson access rules (order, assignment, etc.)
      const canView = await this.canViewLesson(userId, lessonId);
      if (!canView) {
        throw new BaseHttpException(ErrorCodeEnum.LESSON_ORDER_ENFORCED);
      }

      // 2) Load lesson and mark progress
      const lesson = await this.enterLesson(userId, lessonId, transaction);
      if (!lesson) {
        throw new BaseHttpException(ErrorCodeEnum.LESSON_NOT_FOUND);
      }

      const courseId = lesson.section.courseId;

      // 3️) Push views logic to queue
      await this.userViewsQueue.add(REGISTER_USER_VIEW_JOB, {
        userId,
        lessonId,
        courseId
      });

      return lesson;
    });
  }

  async nextLesson(lessonId: number, userId: string): Promise<Lesson | null> {
    const currentLesson = await this.lessonRepo.findOne({ id: lessonId }, [
      { model: Section, include: [Course] }
    ]);

    if (!currentLesson) {
      throw new BaseHttpException(ErrorCodeEnum.LESSON_NOT_FOUND);
    }

    const { sectionId, order, section } = currentLesson;

    let nextLesson: Lesson | null = await this.lessonRepo.findOne(
      {
        sectionId,
        order: { [Op.gt]: order }
      },
      [],
      [['order', 'ASC']]
    );

    // If no next lesson in current section, check the next section
    if (!nextLesson) {
      const nextSection = await this.sectionRepo.findOne(
        {
          courseId: section.courseId,
          order: { [Op.gt]: section.order }
        },
        [],
        [['order', 'ASC']]
      );

      if (nextSection) {
        nextLesson = await this.lessonRepo.findOne(
          { sectionId: nextSection.id },
          [],
          [['order', 'ASC']]
        );
      }
    }

    // Check if user can view the next lesson
    if (nextLesson) {
      const canView = await this.canViewLesson(userId, nextLesson.id);
      if (!canView) {
        return null;
      }
    }

    return nextLesson;
  }

  async previousLesson(lessonId: number) {
    // Fetch the current lesson with its section and course context
    const currentLesson = await this.lessonRepo.findOne({ id: lessonId }, [
      { model: Section, include: [Course] }
    ]);

    if (!currentLesson) {
      throw new BaseHttpException(ErrorCodeEnum.LESSON_NOT_FOUND);
    }

    const { sectionId, order, section } = currentLesson;

    // Find the previous lesson in the same section
    let previousLesson = await this.lessonRepo.findOne(
      {
        sectionId,
        order: { [Op.lt]: order } // Order less than the current lesson
      },
      [],
      [['order', 'DESC']] // Descending order to get the closest previous lesson
    );

    if (!previousLesson) {
      // If no previous lesson in the current section, find the last lesson in the previous section
      const previousSection = await this.sectionRepo.findOne(
        {
          courseId: section.courseId,
          order: { [Op.lt]: section.order } // Order less than the current section
        },
        [],
        [['order', 'DESC']] // Descending order to get the previous section
      );

      if (previousSection) {
        // Fetch the last lesson in the previous section
        previousLesson = await this.lessonRepo.findOne(
          { sectionId: previousSection.id },
          [],
          [['order', 'DESC']]
        );
      }
    }

    return previousLesson;
  }

  // /**
  //  * 1 - get the previous lesson -> check if it is completed (if inforeceLessonsOrder is true)
  //  *                             -> check if it has a quiz and if it is passed
  //  * 2 - get the previous section -> check if it has a quiz and if it is passed
  //  */
  async canViewLesson(userId: string, lessonId: number): Promise<boolean> {
    // 1) Get current lesson including its section and course
    const currentLesson = await this.lessonRepo.findOne(
      { id: lessonId },
      [
        {
          model: Section,
          attributes: ['id', 'order', 'courseId'],
          include: [
            {
              model: Course,
              attributes: ['id', 'enforceLessonsOrder']
            }
          ]
        }
      ],
      undefined,
      ['id', 'order', 'isPreview', 'type', 'sectionId']
    );

    // Return false if lesson not found
    if (!currentLesson) return false;

    // Allow access if lesson is a preview
    if (currentLesson.isPreview) return true;

    // 2) Validate user existence and status
    const user = await this.userRepo.findOne({
      id: userId,
      isBlocked: false,
      isDeleted: false
    });

    if (!user) return false;

    // Allow access if lesson is a live session
    if (currentLesson.type === LessonTypeEnum.LIVE_SESSION) return true;

    const section = currentLesson.section;
    const course = section.course;

    // 3) Check if user is enrolled in the course
    if (user.role === UserRoleEnum.USER) {
      const assignment = await this.userAssignmentsRepo.findOne(
        { userId, courseId: course.id },
        undefined,
        undefined,
        ['id']
      );

      if (!assignment) return false;
    }

    // 4) If course does not enforce lesson order, allow access
    if (!course.enforceLessonsOrder) return true;

    // 5) Traverse previous lessons to check order
    let previousLesson = currentLesson;
    let previousSectionOrder = section.order;

    while (true) {
      // Find previous lesson in the same section
      let prev = await this.lessonRepo.findOne(
        {
          sectionId: previousLesson.sectionId,
          type: { [Op.ne]: LessonTypeEnum.LIVE_SESSION },
          order: { [Op.lt]: previousLesson.order }
        },
        [
          {
            model: Section,
            attributes: ['id', 'order']
          }
        ],
        [['order', 'DESC']],
        ['id', 'isPreview', 'sectionId', 'order']
      );

      // If no lesson in same section, check previous sections
      if (!prev) {
        prev = await this.lessonRepo.findOne(
          {
            '$section.courseId$': course.id,
            type: { [Op.ne]: LessonTypeEnum.LIVE_SESSION },
            '$section.order$': { [Op.lt]: previousSectionOrder }
          },
          [
            {
              model: Section,
              attributes: ['id', 'order']
            }
          ],
          [
            [col('section.order'), 'DESC'],
            ['order', 'DESC']
          ],
          ['id', 'isPreview', 'sectionId', 'order']
        );
      }

      // If no previous lesson exists, allow access
      if (!prev) return true;

      // Skip preview lessons and continue backward
      if (prev.isPreview) {
        previousLesson = prev;
        previousSectionOrder = prev.section.order;
        continue;
      }

      // First non-preview lesson found
      previousLesson = prev;
      break;
    }

    // 6) Check if user completed the previous lesson
    const progress = await this.getLessonProgress(userId, previousLesson.id);

    return !!progress?.completed;
  }

  @OnEvent(CHECK_COURSE_PROGRESS_EVENT, { async: true })
  async updateUserCourseProgressByLesson(event: {
    userId: string;
    lessonId: number;
  }): Promise<void> {
    const { userId, lessonId } = event;
    // 1. Get courseId from lesson's section
    let courseId = (
      await this.lessonRepo.findOne(
        {
          id: lessonId
        },
        [
          {
            model: Section
          }
        ]
      )
    )?.section?.courseId;

    if (!courseId) {
      const lesson = await this.lessonRepo.findOne(
        {
          id: lessonId
        },
        [
          {
            model: Section,
            include: [
              {
                model: Course
              }
            ]
          }
        ]
      );

      if (!lesson) {
        throw new BaseHttpException(ErrorCodeEnum.LESSON_NOT_FOUND);
      }

      courseId = lesson.section.courseId;
    }

    // 2. Calculate number of completed lessons
    const numberOfCompletedLessons = await this.getCompletedLessonsCount(
      userId,
      courseId
    );

    // 3. Update user course progress
    await this.updateUserAssignedCourse(
      userId,
      courseId,
      numberOfCompletedLessons
    );

    // 4. Check course completion status
    const { completedLessons, totalLessons } =
      await this.userService.getUserCourseProgress(userId, courseId);

    if (completedLessons === totalLessons) {
      await this.courseService.markCourseAsCompleted(courseId, userId);
    } else {
      await this.courseService.markCourseAsNotCompleted(courseId, userId);
    }
  }

  // async lastVisitedLessons(userId: string): Promise<UserLessonVisit[]> {
  //   const visits = await this.userLessonVisitRepo.findAll(
  //     { userId },
  //     [
  //       {
  //         model: Lesson
  //       },
  //       {
  //         model: User
  //       },
  //       {
  //         model: Course
  //       }
  //     ],
  //     [['createdAt', 'DESC']]
  //   );

  //   const uniqueCourses = new Map();

  //   for (const visit of visits) {
  //     if (!uniqueCourses.has(visit.courseId)) {
  //       uniqueCourses.set(visit.courseId, visit);
  //     }
  //     if (uniqueCourses.size === 2) break;
  //   }

  //   return Array.from(uniqueCourses.values());
  // }

  async lastVisitedLessons(userId: string): Promise<UserLessonVisit[]> {
    const visits = await this.sequelize.query(
      `
      SELECT ulv.*
      FROM "UserLessonVisits" ulv
      JOIN (
        SELECT DISTINCT ON ("courseId") "courseId", "createdAt", "id"
        FROM "UserLessonVisits"
        WHERE "userId" = :userId
        ORDER BY "courseId", "createdAt" DESC
      ) latest
      ON ulv.id = latest.id
      ORDER BY ulv."createdAt" DESC
      LIMIT 2;
      `,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
        raw: true
      }
    );

    const populated = await Promise.all(
      (visits as any[]).map(async v => {
        return this.userLessonVisitRepo.findOne({ id: v.id }, [
          { model: Lesson },
          { model: User },
          { model: Course }
        ]);
      })
    );

    return populated.filter(Boolean) as UserLessonVisit[];
  }

  async isAssignedToCourse(userId: string, courseId: string): Promise<boolean> {
    const assignment = await this.userAssignmentsRepo.findOne(
      { userId, courseId },
      undefined,
      undefined,
      ['id']
    );

    if (!assignment) return false;

    return true;
  }
}
