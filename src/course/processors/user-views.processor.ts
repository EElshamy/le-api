import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Inject } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { UserLessonVisit } from '../models/user-lesson-visit.model';
import { CourseService } from '../services/course.service';

export interface RegisterUserViewJob {
  userId: string;
  lessonId: number;
  courseId: string;
}

export const USER_VIEWS_QUEUE = 'userViews';
export const REGISTER_USER_VIEW_JOB = 'registerUserView';

@Processor(USER_VIEWS_QUEUE)
export class UserViewsProcessor {
  constructor(
    @Inject(Repositories.UserLessonVisitsRepository)
    private readonly userLessonVisitRepo: IRepository<UserLessonVisit>,
    private readonly courseService: CourseService
  ) {}

  @Process(REGISTER_USER_VIEW_JOB)
  async handleRegisterUserView(job: Job<RegisterUserViewJob>) {
    const { userId, lessonId, courseId } = job.data;

    // Register lesson visit
    await this.userLessonVisitRepo.createOne({
      userId,
      lessonId,
      courseId
    });

    // Register course & diploma views
    await this.courseService.getUserDiplomasForCourseAndRegisterViews({
      userId,
      courseId
    });
  }
}
