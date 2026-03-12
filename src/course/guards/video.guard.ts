import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  IContextAuthService,
  IContextAuthServiceToken
} from '@src/_common/context/context-auth.interface';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { GqlContext } from '@src/_common/graphql/graphql-context.type';
import { UserRoleEnum } from '@src/user/user.enum';
import { CourseDetail } from '../models/course-detail.model';
import { Lesson } from '../models/lesson.model';
import { Section } from '../models/section.model';
import { UsersAssignment } from '../models/user-assignments.model';

@Injectable()
export class VideoGuard implements CanActivate {
  allowTemporaryToken: boolean;

  constructor(
    @Inject(IContextAuthServiceToken)
    private readonly authService: IContextAuthService,
    @Inject(Repositories.LessonsRepository)
    private readonly lessonRepo: IRepository<Lesson>,
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly userAssignedCoursesRepo: IRepository<UsersAssignment>,
    @Inject(Repositories.CourseDetailsRepository)
    private readonly courseDetailsRepo: IRepository<CourseDetail>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const handlerName = ctx.getHandler().name;
    const { currentUser, sessionId, isTempToken } =
      ctx.getContext() as GqlContext;
    const videoId = ctx.getArgs()?.input?.videoId ?? ctx.getArgs()?.videoId;
    if (videoId) {
      const courseLesson = await this.lessonRepo.findOne({ videoId }, [
        Section
      ]);
      if (!courseLesson) {
        const previewCourse = await this.courseDetailsRepo.findOne(
          {
            promoVideo: videoId
          },
          [],
          ['id']
        );
        if (previewCourse) return true;
      } else {
        if (courseLesson.isPreview) return true;
        if (
          ![UserRoleEnum.ADMIN, UserRoleEnum.LECTURER].includes(
            currentUser.role
          )
        ) {
          const userAssigned = await this.userAssignedCoursesRepo.findOne({
            userId: currentUser.id,
            courseId: courseLesson.section.courseId
          });
          if (!userAssigned)
            throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED);
        }
      }
    }
    await this.authService.isUserAllowedToContinue({
      currentUser,
      currentSessionId: sessionId,
      isTempToken,
      context,
      allowTemporaryToken: this.allowTemporaryToken,
      handlerName
    });
    return true;
  }
}
