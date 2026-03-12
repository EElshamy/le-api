import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { IDataLoaderService } from '@src/_common/dataloader/dataloader.interface';
import {
  BooleanLoaderType,
  CourseDetailsLoaderType,
  CourseLogsLoaderType,
  CourseSectionLoaderType,
  SectionLessonLoaderType,
  UsersLoaderType
} from '@src/_common/dataloader/dataloader.type';
import { CourseSkill } from '@src/course-specs/skill/models/course-skill.model';
import { Skill } from '@src/course-specs/skill/models/skill.model';
import { CourseTool } from '@src/course-specs/tool/models/course-tool.mode';
import { Tool } from '@src/course-specs/tool/models/tool.model';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { CourseStatusEnum } from '../enums/course.enum';
import { CourseDetail } from '../models/course-detail.model';
import { ChangeLog } from '../models/course-log.model';
import { Course } from '../models/course.model';
import { Lesson } from '../models/lesson.model';
import { Review } from '../../reviews/review.model';
import { Section } from '../models/section.model';
import { QuizQuestion } from '@src/quiz/models/quiz-question.model';
import { QuizAnswer } from '@src/quiz/models/quiz-answer.model';

@Injectable()
export class CourseDataloader implements IDataLoaderService {
  constructor(
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.CourseDetailsRepository)
    private readonly courseDetailRepo: IRepository<CourseDetail>,
    @Inject(Repositories.CourseSkillsRepository)
    private readonly skillCourseRepo: IRepository<CourseSkill>,
    @Inject(Repositories.CourseToolsRepository)
    private readonly toolCourseRepo: IRepository<CourseTool>,
    @Inject(Repositories.ChangeLogsRepository)
    private readonly changeLogRepo: IRepository<ChangeLog>,
    @Inject(Repositories.LessonsRepository)
    private readonly lessonRepo: IRepository<Lesson>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(Repositories.SectionsRepository)
    private readonly sectionRepo: IRepository<Section>,
    @Inject(Repositories.ReviewsRepository)
    private readonly reviewRepo: IRepository<Review>
  ) {}
  createLoaders() {
    return {
      canCategoryBeDeletedLoader: <BooleanLoaderType>(
        new DataLoader(
          async (categoryIds: string[]) =>
            await this.canCategoryBeDeleted(categoryIds)
        )
      ),
      canSkillBeDeletedLoader: <BooleanLoaderType>(
        new DataLoader(
          async (skillIds: string[]) =>
            await this.canSkillBeDeletedLoader(skillIds)
        )
      ),
      canToolBeDeletedLoader: <BooleanLoaderType>(
        new DataLoader(
          async (toolIds: string[]) =>
            await this.canToolBeDeletedLoader(toolIds)
        )
      ),
      courseDetailsLoader: <CourseDetailsLoaderType>(
        new DataLoader(
          async (courseIds: string[]) =>
            await this.courseDetailsLoader(courseIds)
        )
      ),
      courseLogsLoader: <CourseLogsLoaderType>(
        new DataLoader(
          async (courseIds: string[]) =>
            await this.courseChangeLogsLoader(courseIds)
        )
      ),
      sectionLessonsLoader: <SectionLessonLoaderType>(
        new DataLoader(
          async (sectionIds: string[]) =>
            await this.sectionLessonsLoader(sectionIds)
        )
      ),
      courseSectionsLoader: <CourseSectionLoaderType>(
        new DataLoader(
          async (courseIds: string[]) =>
            await this.courseSectionsLoader(courseIds)
        )
      ),
      reviewsLoader: new DataLoader(
        async (courseIds: string[]) =>
          await this.getReviewsByCourseIds(courseIds)
      ),
      coursesLoader: new DataLoader(
        async (courseIds: string[]) => await this.getCoursesByIds(courseIds)
      ),
      enrolledUserLoader: <UsersLoaderType>(
        new DataLoader(async (userIdsArray: string[][]) => {
          // Flatten the array of arrays
          const flattenedIds = userIdsArray.flat();

          const users = await this.enrolledUserLoader(flattenedIds);

          return userIdsArray.map(ids =>
            ids.map(id => users.find(user => user.id === id) || null)
          );
        })
      )
    };
  }
  async canCategoryBeDeleted(categoryIds: string[]) {
    const courseSkills = await this.courseRepo.countGroupedBy(
      {
        categoryId: categoryIds,
        status: { [Op.ne]: CourseStatusEnum.DRAFTED }
      },
      'categoryId',
      'coursesCount'
    );

    const isCourseUsed = {};

    courseSkills.forEach(course => {
      isCourseUsed[course.categoryId] = true;
    });

    return categoryIds.map(categoryId => !(isCourseUsed[categoryId] ?? false));
  }
  async canSkillBeDeletedLoader(skillIds: string[]) {
    const courseSkills = await this.skillCourseRepo.countGroupedBy(
      {
        skillId: skillIds
      },
      'skillId',
      'coursesCount',
      [
        { model: Skill, attributes: [], required: true },
        {
          model: Course,
          required: true,
          attributes: [],
          where: {
            status: { [Op.ne]: CourseStatusEnum.DRAFTED }
          }
        }
      ]
    );

    const isSkillUsed = new Map<string, boolean>();

    courseSkills.forEach(courseSkill => {
      isSkillUsed.set(courseSkill.skillId, true);
    });

    return skillIds.map(skillId => !(isSkillUsed.get(skillId) ?? false));
  }
  async canToolBeDeletedLoader(toolIds: string[]) {
    const courseTools = await this.toolCourseRepo.countGroupedBy(
      {
        toolId: toolIds
      },
      'toolId',
      'coursesCount',
      [
        { model: Tool, attributes: [], required: true },
        {
          model: Course,
          required: true,
          attributes: [],
          where: {
            status: { [Op.ne]: CourseStatusEnum.DRAFTED }
          }
        }
      ]
    );

    const isToolUsed = new Map<string, boolean>();

    courseTools.forEach(courseTool => {
      isToolUsed.set(courseTool.toolId, true);
    });

    return toolIds.map(toolId => !(isToolUsed.get(toolId) ?? false));
  }
  async courseDetailsLoader(courseIds: string[]) {
    const courses = await this.courseDetailRepo.findAll({
      courseId: courseIds
    });

    return courseIds.map(courseId =>
      courses.find(course => course.courseId === courseId)
    );
  }

  async sectionLessonsLoader(sectionIds: string[]) {
    const sectionsLessons = await this.lessonRepo.findAll(
      {
        sectionId: sectionIds
      },
      [
        {
          model: QuizQuestion,
          required: false,
          include: [{ model: QuizAnswer, required: false }]
        }
      ],
      [['order', 'ASC']]
    );

    const sectionLessonMap: Record<string, Lesson[]> = {};
    sectionsLessons.forEach(lesson => {
      if (!sectionLessonMap[lesson.sectionId])
        sectionLessonMap[lesson.sectionId] = [];
      sectionLessonMap[lesson.sectionId].push(lesson);
    });
    return sectionIds.map(sectionId => sectionLessonMap[sectionId] ?? []);
  }

  async courseSectionsLoader(courseIds: string[]) {
    const sections = await this.sectionRepo.findAll(
      { courseId: courseIds },
      [],
      [['order', 'ASC']]
    );

    const sectionCourse = sections.reduce(
      (acc: { [courseId: string]: Section[] }, section: Section) => {
        if (!acc[section.courseId]) acc[section.courseId] = [];
        acc[section.courseId].push(section);
        return acc;
      },
      {}
    );

    return courseIds.map(courseId => sectionCourse[courseId] ?? []);
  }

  async courseChangeLogsLoader(courseIds: string[]) {
    const logs = await this.changeLogRepo.findAll({ courseId: courseIds });
    const logCourse = logs.reduce(
      (acc: { [courseId: string]: ChangeLog[] }, log: ChangeLog) => {
        if (!acc[log.courseId]) acc[log.courseId] = [];
        acc[log.courseId].push(log);
        return acc;
      },
      {}
    );
    return courseIds.map(courseId => logCourse[courseId] ?? []);
  }

  async enrolledUserLoader(userIds: string[]) {
    const users = await this.userRepo.findAll({
      id: userIds,
      isBlocked: false,
      isDeleted: false
    });
    return userIds.map(
      userId => users.find(user => user.id === userId) || null
    );
  }

  private async getCoursesByIds(courseIds: string[]) {
    return await this.courseRepo.findAll({
      id: {
        [Op.in]: courseIds
      }
    });
  }

  async getReviewsByCourseIds(courseIds: string[]) {
    const reviews = await this.reviewRepo.findAll(
      { learningProgramId: courseIds },
      [{ model: User }]
    );

    //todo .. refactor this
    const reviewCourse = reviews.reduce(
      (acc: { [courseId: string]: Review[] }, review: Review) => {
        if (!acc[review.learningProgramId]) acc[review.learningProgramId] = [];
        acc[review.learningProgramId].push(review);
        return acc;
      },
      {}
    );
    return courseIds.map(courseId => reviewCourse[courseId] ?? []);
  }
}
