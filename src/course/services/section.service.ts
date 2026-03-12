import { Inject, Injectable } from '@nestjs/common';
import { Ulid } from 'id128';
import { Op, Sequelize, Transaction } from 'sequelize';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { UploaderService } from '../../_common/uploader/uploader.service';
import { CourseStatusEnum, LessonTypeEnum } from '../enums/course.enum';
import {
  CreateDraftedCourseSectionsInput,
  CreateLessonInput,
  CreateSectionInput
} from '../inputs/create-course.input';
import { UpdateCourseSectionsInput } from '../inputs/update-course.input';
import { Course } from '../models/course.model';
import { Lesson } from '../models/lesson.model';
import { Section } from '../models/section.model';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { QuizService } from '@src/quiz/quiz.service';

@Injectable()
export class SectionService {
  constructor(
    @Inject(Repositories.SectionsRepository)
    private readonly sectionRepo: IRepository<Section>,
    @Inject(Repositories.LessonsRepository)
    private readonly lessonRepo: IRepository<Lesson>,
    private readonly uploaderService: UploaderService,
    private readonly quizService: QuizService
  ) {}
  /**
   * only delete sections for drafted courses because they don't have user progress
   * but for already published it cannot be deleted as it will be linked with user progress
   */
  async deleteDraftedCourseSections(courseId: string) {
    return await this.sectionRepo.deleteAll({ courseId });
  }
  async createCourseSectionsAndLessons(
    course: Course,
    inputSections: CreateDraftedCourseSectionsInput[],
    transaction?: Transaction
  ) {
    inputSections = inputSections.map(sec => {
      let articlesCount = 0,
        videosCount = 0,
        liveSessionsCount = 0,
        quizzesCount = 0,
        learningTimeInMinutes = 0;

      const sectionId = Ulid.generate().toRaw();

      sec.lessonsInput?.forEach(lesson => {
        learningTimeInMinutes += lesson.learningTimeInMinutes ?? 0;

        if (lesson.type === LessonTypeEnum.ARTICLE) articlesCount += 1;
        if (lesson.type === LessonTypeEnum.VIDEO) videosCount += 1;
        if (lesson.type === LessonTypeEnum.LIVE_SESSION) liveSessionsCount += 1;
        if (lesson.type === LessonTypeEnum.QUIZ) quizzesCount += 1;

        lesson.sectionId = sectionId;
      });

      return {
        ...sec,
        id: sectionId,
        courseId: course.id,
        learningTimeInMinutes,
        videosCount,
        articlesCount,
        liveSessionsCount,
        quizzesCount
      };
    });

    // console.log('inputSections :', inputSections);
    // console.log('------------------------------------');

    let sections = [],
      lessons = [];

    try {
      sections = await this.sectionRepo.bulkCreate(inputSections, transaction);

      // console.log('sections :', sections);
      // console.log('------------------------------------');

      const lessonsInput = inputSections
        .flatMap(sec => sec.lessonsInput)
        .filter(Boolean);

      // console.log('lessonsInput :', lessonsInput);
      // console.log('------------------------------------');

      if (lessonsInput?.length) {
        const contentAttachments: string[][] = [];
        const lastLesson = await this.lessonRepo.findOne(
          {},
          [],
          [[Sequelize.col('id'), SortTypeEnum.DESC]],
          ['id']
        );

        let lastId = lastLesson ? lastLesson.id : 0;

        const lessonsData = inputSections
          .flatMap(sec =>
            sec.lessonsInput.map(
              ({
                contentAttachments: contentAttachmentsInput,
                sectionId,
                questions,
                ...restLesson
              }) => {
                lastId += 1;
                const lessonId = lastId;
                return {
                  ...restLesson,
                  id: lessonId,
                  sectionId,
                  contentAttachments: contentAttachmentsInput ?? []
                };
              }
            )
          )
          .filter(Boolean);

        for (const lesson of lessonsData) {
          const createdLesson = await this.lessonRepo.createOne(
            lesson,
            transaction
          );
          lessons.push(createdLesson);

          // handle lesson if it's a quiz
          if (lesson.type === LessonTypeEnum.QUIZ) {
            const originalLessonInput = lessonsInput.find(
              li =>
                li.sectionId === lesson.sectionId && li.order === lesson.order
            );

            if (originalLessonInput) {
              const {
                passingGrade,
                duration,
                durationType,
                attemptsAllowed,
                showCorrectAnswers,
                questions
              } = originalLessonInput as any;

              await this.quizService.createQuizForLesson(
                {
                  lessonId: createdLesson.id,
                  passingGrade,
                  duration,
                  durationType,
                  attemptsAllowed,
                  showCorrectAnswers,
                  questions
                },
                transaction
              );
            }
          }
        }

        await this.setLessonResourcesUploadedFilesReferences(
          lessons,
          contentAttachments,
          transaction
        );
        console.log('------------------------------------');
      }
    } catch (err) {
      console.log('error when creating sections or lessons ❌❌❌ ');
      console.log('err message : ', err.message);
      console.log('err stack : ', err.stack);
      console.log('errors : ', err.errors);
      console.log('------------------❌❌❌------------------');
    }

    return { sections, lessons };
  }

  async sectionsAndLessonsByCourseId(
    courseId: string,
    pagination: NullablePaginatorInput = {}
  ): Promise<PaginationRes<Section>> {
    return await this.sectionRepo.findPaginated(
      { courseId },
      [['order', 'ASC']],
      pagination?.paginate?.page || 1,
      pagination?.paginate?.limit || 15
    );
  }
  private async setLessonResourcesUploadedFilesReferences(
    lessons: Lesson[],
    contentAttachments: string[][] = [],
    transaction: Transaction
  ) {
    for (const lessonIdx in lessons) {
      if (lessons[lessonIdx].resources?.length)
        await this.uploaderService.setUploadedFilesReferences(
          lessons[lessonIdx].resources.map(resource => resource.url),
          'Lesson',
          'resources_url',
          lessons[lessonIdx].id,
          transaction
        );
      if (contentAttachments[lessonIdx]?.length)
        await this.uploaderService.setUploadedFilesReferences(
          contentAttachments[lessonIdx],
          'Lesson',
          'content',
          lessons[lessonIdx].id,
          transaction
        );
    }
  }

  async deleteLessonsAndSections(
    lessonsIds: number[],
    sectionsIds: string[],
    transaction: Transaction
  ) {
    const associatedLessonsVideos = (
      await this.lessonRepo.findAll(
        {
          [Op.or]: [
            ...(lessonsIds?.length ? [{ id: lessonsIds }] : []),
            ...(sectionsIds?.length ? [{ sectionId: sectionsIds }] : [])
          ],
          videoId: { [Op.ne]: null }
        },
        [],
        'id',
        ['videoId']
      )
    ).map(vidLesson => vidLesson.videoId);

    if (sectionsIds?.length)
      await this.sectionRepo.deleteAll({ id: sectionsIds }, transaction);
    if (lessonsIds?.length)
      await this.lessonRepo.deleteAll({ id: lessonsIds }, transaction);

    return associatedLessonsVideos;
  }

  async updateCourseSectionsAndLessons(
    course: Course,
    input: UpdateCourseSectionsInput[],
    transaction: Transaction
  ) {
    const sectionArray = [],
      lessonsArray = [],
      sectionsIds = [],
      lessonsIds = [];

    let lastLesson = await this.lessonRepo.findOne(
      {},
      [],
      [[Sequelize.col('id'), SortTypeEnum.DESC]]
    );
    let lastLessonId = lastLesson?.id || 0;

    input.forEach(inp => {
      if (!inp.sectionId) {
        this.validateSectionCreationInput(inp);
        inp.sectionId = Ulid.generate().toRaw();
      }

      sectionsIds.push(inp.sectionId);

      inp.lessons?.forEach(lesson => {
        lesson.sectionId = inp.sectionId;
        if (!lesson.lessonId) {
          try {
            this.validateLessonCreationInput(lesson);
          } catch (err) {
            console.error('Validation error:', err);
            throw new BaseHttpException(ErrorCodeEnum.INVALID_LESSON_INPUT);
          }

          lesson.lessonId = ++lastLessonId;
        }
        if (lesson.lessonId) lessonsIds.push(lesson.lessonId);
      });
    });

    let sections =
      sectionsIds.length ?
        await this.sectionRepo.findAll({ id: sectionsIds })
      : [];
    let lessons =
      lessonsIds.length ?
        await this.lessonRepo.findAll({ id: lessonsIds })
      : [];

    input.forEach(inp => {
      const section = sections.find(section => section.id === inp.sectionId);

      sectionArray.push({
        id: inp.sectionId,
        ...(section && section.dataValues),
        ...inp,
        courseId: course.id
      });

      inp.lessons?.forEach(lessonInp => {
        const lesson = lessons.find(lesson => lesson.id === lessonInp.lessonId);

        lessonsArray.push({
          id: lessonInp.lessonId,
          ...(lesson && lesson.dataValues),
          ...lessonInp
        });
      });
    });

    // Split into new and existing sections
    const newSections = sectionArray.filter(
      sec => !sections.some(existingSec => existingSec.id === sec.id)
    );
    const existingSections = sectionArray.filter(sec =>
      sectionsIds.includes(sec.id)
    );

    // Insert new sections
    if (newSections.length) {
      await this.sectionRepo.bulkCreate(newSections, transaction);
    }

    // Update existing sections
    if (existingSections.length) {
      await Promise.all(
        existingSections.map(sec =>
          this.sectionRepo.updateOne({ id: sec.id }, sec, transaction)
        )
      );
    }

    // Split into new and existing lessons
    const newLessons = lessonsArray.filter(
      lesson => !lessons.some(existing => existing.id === lesson.id)
    );

    const existingLessons = lessonsArray.filter(lesson =>
      lessonsIds.includes(lesson.id)
    );

    const createdLessons: Lesson[] = [];

    // Insert new lessons
    if (newLessons.length) {
      for (const newLesson of newLessons) {
        const createdLesson = await this.lessonRepo.createOne(
          newLesson,
          transaction
        );

        createdLessons.push(createdLesson);

        if (newLesson.type === LessonTypeEnum.QUIZ) {
          await this.quizService.createQuizForLesson(
            {
              lessonId: createdLesson.id,
              passingGrade: newLesson.passingGrade,
              duration: newLesson.duration,
              durationType: newLesson.durationType,
              attemptsAllowed: newLesson.attemptsAllowed,
              showCorrectAnswers: newLesson.showCorrectAnswers,
              questions: newLesson.questions
            },
            transaction
          );
        }
      }
    }

    // Update existing lessons
    if (existingLessons.length) {
      for (const existingLesson of existingLessons) {
        await this.lessonRepo.updateOne(
          { id: existingLesson.id },
          { ...existingLesson },
          transaction
        );

        if (existingLesson.type === LessonTypeEnum.QUIZ) {
          await this.quizService.updateQuiz(
            {
              lessonId: existingLesson.id,
              passingGrade: existingLesson.passingGrade,
              duration: existingLesson.duration,
              durationType: existingLesson.durationType,
              attemptsAllowed: existingLesson.attemptsAllowed,
              showCorrectAnswers: existingLesson.showCorrectAnswers,
              questions: existingLesson.questions
            },
            transaction
          );
        }
      }
    }

    sections = await this.updateCourseSectionsAttributes(
      course.id,
      transaction
    );
    const allLessons = await this.lessonRepo.findAll({
      sectionId: sections.map(s => s.id)
    });

    // set uploaded files references
    const contentAttachments = [...createdLessons, ...existingLessons].map(
      l => l.contentAttachments ?? []
    );

    await this.setLessonResourcesUploadedFilesReferences(
      [...createdLessons, ...existingLessons],
      contentAttachments,
      transaction
    );

    return { sections, lessons: allLessons };
  }

  // async updateCourseSectionsAttributes(
  //   courseId: string,
  //   transaction: Transaction
  // ) {
  //   const sectionsAttributes = await this.lessonRepo.findAll(
  //     {},
  //     [{ model: Section, where: { courseId }, required: true, attributes: [] }],
  //     'sectionId',
  //     {
  //       include: [
  //         'sectionId',
  //         [
  //           Sequelize.literal(
  //             `SUM(CASE WHEN "type" = '${LessonTypeEnum.ARTICLE}' THEN 1 ELSE 0 END)`
  //           ),
  //           'articlesCount'
  //         ],
  //         [
  //           Sequelize.literal(
  //             `SUM(CASE WHEN "type" = '${LessonTypeEnum.VIDEO}' THEN 1 ELSE 0 END)`
  //           ),
  //           'videosCount'
  //         ],
  //         [
  //           Sequelize.fn(
  //             'SUM',
  //             Sequelize.literal(`"Lesson"."learningTimeInMinutes"`)
  //           ),
  //           'learningTimeInMinutesSum'
  //         ]
  //       ],
  //       exclude: Object.keys(Lesson.getAttributes())
  //     },
  //     'sectionId',
  //     transaction
  //   );

  //   let articlesCountStatement = '',
  //     videosCountStatement = '',
  //     learningTimeInMinutesStatement = '',
  //     sectionsIds = [];
  //   for (const sectionsAttribute of sectionsAttributes) {
  //     const articlesCount =
  //         sectionsAttribute.getDataValue('articlesCount') ?? 0,
  //       videosCount = sectionsAttribute.getDataValue('videosCount') ?? 0,
  //       learningTimeInMinutes =
  //         sectionsAttribute.getDataValue('learningTimeInMinutesSum') ?? 0;

  //     articlesCountStatement =
  //       articlesCountStatement +
  //       `WHEN "id" = '${sectionsAttribute.sectionId}' THEN (${articlesCount})::integer `;

  //     videosCountStatement =
  //       videosCountStatement +
  //       `WHEN "id" = '${sectionsAttribute.sectionId}' THEN (${videosCount})::integer `;

  //     learningTimeInMinutesStatement =
  //       learningTimeInMinutesStatement +
  //       `WHEN "id" = '${sectionsAttribute.sectionId}' THEN (${learningTimeInMinutes})::integer `;

  //     sectionsIds.push(sectionsAttribute.sectionId);
  //   }

  //   return await this.sectionRepo.updateAll(
  //     { id: sectionsIds },
  //     {
  //       articlesCount: Sequelize.literal(
  //         `CASE ${articlesCountStatement} END`
  //       ) as any,
  //       videosCount: Sequelize.literal(
  //         `CASE ${videosCountStatement} END`
  //       ) as any,
  //       learningTimeInMinutes: Sequelize.literal(
  //         `CASE ${learningTimeInMinutesStatement} END`
  //       ) as any
  //     },
  //     transaction
  //   );
  // }
  async updateCourseSectionsAttributes(
    courseId: string,
    transaction: Transaction
  ) {
    const sectionsAttributes = await this.lessonRepo.findAll(
      {}, // where
      [
        {
          model: Section,
          where: { courseId },
          required: true,
          attributes: []
        }
      ], // include
      'sectionId', // sort
      [
        'sectionId',
        [
          Sequelize.literal(
            `SUM(CASE WHEN "Lesson"."type" = '${LessonTypeEnum.ARTICLE}' THEN 1 ELSE 0 END)`
          ),
          'articlesCount'
        ],
        [
          Sequelize.literal(
            `SUM(CASE WHEN "Lesson"."type" = '${LessonTypeEnum.VIDEO}' THEN 1 ELSE 0 END)`
          ),
          'videosCount'
        ],
        [
          Sequelize.literal(
            `SUM(CASE WHEN "Lesson"."type" = '${LessonTypeEnum.LIVE_SESSION}' THEN 1 ELSE 0 END)`
          ),
          'liveSessionsCount'
        ],
        [
          Sequelize.literal(
            `SUM(CASE WHEN "Lesson"."type" = '${LessonTypeEnum.QUIZ}' THEN 1 ELSE 0 END)`
          ),
          'quizzesCount'
        ],
        [
          Sequelize.fn('SUM', Sequelize.col('Lesson.learningTimeInMinutes')),
          'learningTimeInMinutesSum'
        ]
      ], // attributes
      ['sectionId'], // group
      transaction // transaction
    );

    if (!sectionsAttributes.length) {
      return [];
    }

    let articlesCountStatement = '',
      videosCountStatement = '',
      liveSessionsCountStatement = '',
      quizzesCountStatement = '',
      learningTimeInMinutesStatement = '',
      sectionsIds: string[] = [];

    for (const sectionAttribute of sectionsAttributes) {
      const sectionId = sectionAttribute.sectionId;

      if (!sectionId) {
        continue;
      }

      const articlesCount = sectionAttribute.getDataValue('articlesCount') ?? 0;
      const videosCount = sectionAttribute.getDataValue('videosCount') ?? 0;
      const liveSessionsCount =
        sectionAttribute.getDataValue('liveSessionsCount') ?? 0;
      const quizzesCount = sectionAttribute.getDataValue('quizzesCount') ?? 0;
      const learningTimeInMinutes =
        sectionAttribute.getDataValue('learningTimeInMinutesSum') ?? 0;

      articlesCountStatement += `WHEN "id" = '${sectionId}' THEN (${articlesCount})::integer `;
      videosCountStatement += `WHEN "id" = '${sectionId}' THEN (${videosCount})::integer `;
      liveSessionsCountStatement += `WHEN "id" = '${sectionId}' THEN (${liveSessionsCount})::integer `;
      quizzesCountStatement += `WHEN "id" = '${sectionId}' THEN (${quizzesCount})::integer `;
      learningTimeInMinutesStatement += `WHEN "id" = '${sectionId}' THEN (${learningTimeInMinutes})::integer `;

      sectionsIds.push(sectionId);
    }

    if (sectionsIds.length === 0) {
      return [];
    }

    const updateResult = await this.sectionRepo.updateAll(
      { id: sectionsIds },
      {
        articlesCount: Sequelize.literal(
          `CASE ${articlesCountStatement} END`
        ) as any,
        videosCount: Sequelize.literal(
          `CASE ${videosCountStatement} END`
        ) as any,
        liveSessionsCount: Sequelize.literal(
          `CASE ${liveSessionsCountStatement} END`
        ) as any,
        quizzesCount: Sequelize.literal(
          `CASE ${quizzesCountStatement} END`
        ) as any,
        learningTimeInMinutes: Sequelize.literal(
          `CASE ${learningTimeInMinutesStatement} END`
        ) as any
      },
      transaction
    );

    return updateResult;
  }

  private validateSectionCreationInput(input: Partial<CreateSectionInput>) {
    if (!input.enTitle || !input.arTitle)
      throw new BaseHttpException(ErrorCodeEnum.INVALID_SECTIONS_INPUT);
    if (input.order === undefined)
      throw new BaseHttpException(ErrorCodeEnum.INVALID_SECTIONS_INPUT);
  }

  private validateLessonCreationInput(input: any) {
    // Basic validation per lesson type
    if (
      (input.type === LessonTypeEnum.ARTICLE && !input.content) ||
      (input.type === LessonTypeEnum.VIDEO && !input.videoId) ||
      (input.type === LessonTypeEnum.LIVE_SESSION &&
        (!input.videoUrl ||
          !input.liveSessionStartAt ||
          !input.liveSessionEndAt))
    ) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_LESSON_INPUT);
    }
    // Ensure required attributes exist (excluding type-specific nullable ones)
    Object.keys(Lesson.getAttributes())
      .filter(
        item =>
          ![
            'id',
            'createdAt',
            'updatedAt',
            'videoUrl',
            'liveSessionEndAt',
            'liveSessionStartAt',
            'content',
            'videoId',
            'overview',
            'learningTimeInMinutes',
            'resources',
            // QUIZ-specific optional fields
            'passingGrade',
            'duration',
            'durationType',
            'attemptsAllowed',
            'showCorrectAnswers',
            'numberOfQuestions',
            'questions'
          ].includes(item)
      )
      .forEach(attribute => {
        if (input[attribute] === undefined) {
          console.log('🚨 Missing attribute:', attribute);
          throw new BaseHttpException(ErrorCodeEnum.INVALID_LESSON_INPUT);
        }
      });
  }

  async findLessonsByVideoIds(videoIds: string[]) {
    return (await this.lessonRepo.findAll({ videoId: videoIds })).map(
      lesson => lesson.videoId
    );
  }

  async sectionResources(sectionId: string) {
    const lessons = await this.lessonRepo.findAll({
      sectionId,
      resources: { [Op.ne]: [null] }
    });

    // Map resources or return an empty array if lessons are invalid
    return lessons?.map(lesson => lesson.resources || []);
  }

  async sectionsByCourseId(courseId: string) {
    return await this.sectionRepo.findAll(
      { courseId },
      [{ model: Lesson, where: { resources: { [Op.ne]: [null] } } }],
      [['order', 'ASC']]
    );
  }

  async validateLessonDates(
    startDate: Date | undefined,
    endDate: Date | undefined,
    courseStatus: CourseStatusEnum
  ): Promise<void> {
    const now = new Date();

    const isDraftOrPreview =
      courseStatus === CourseStatusEnum.DRAFTED ||
      courseStatus === CourseStatusEnum.PREVIEWED;

    if (isDraftOrPreview) {
      if (startDate && endDate) {
        // Start date after or equal to end date
        if (startDate.getTime() >= endDate.getTime()) {
          throw new BaseHttpException(ErrorCodeEnum.START_DATE_AFTER_END_DATE);
        }

        // End date in the past (including time)
        if (endDate.getTime() < now.getTime()) {
          throw new BaseHttpException(ErrorCodeEnum.END_DATE_IN_PAST);
        }

        // Start date in the past (including time)
        if (startDate.getTime() < now.getTime()) {
          throw new BaseHttpException(ErrorCodeEnum.START_DATE_IN_PAST);
        }
      }
    } else {
      // for published courses, both dates are required
      if (!startDate || !endDate) {
        throw new BaseHttpException(ErrorCodeEnum.MISSING_SESSION_DATES);
      }

      // check if start date is after or equal to end date
      if (startDate.getTime() >= endDate.getTime()) {
        throw new BaseHttpException(ErrorCodeEnum.START_DATE_AFTER_END_DATE);
      }

      // check if end date is in the past (including time)
      if (endDate.getTime() < now.getTime()) {
        throw new BaseHttpException(ErrorCodeEnum.END_DATE_IN_PAST);
      }

      // check if start date is in the past (including time)
      if (startDate.getTime() < now.getTime()) {
        throw new BaseHttpException(ErrorCodeEnum.START_DATE_IN_PAST);
      }
    }
  }
}
