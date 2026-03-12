import { Inject, Injectable } from '@nestjs/common';
import { CourseDataloader } from '@src/course/loaders/course.dataloaders';
import { BlogDataloader } from '../../blogs/blog/loaders/blog.dataloader';
import { CategoryDataloader } from '../../course-specs/category/category.dataloader';
import { SkillDataloader } from '../../course-specs/skill/skill.dataloader';
import { ToolDataloader } from '../../course-specs/tool/tool.dataloader';
import { JobTitleDataloader } from '../../job-title/job-title.dataloader';
import { LecturerDataloader } from '../../lecturer/loaders/lecturer.dataloader';
import { NotificationDataloader } from '../../notification/notification.dataloader';
import { SocialAuthDataloader } from '../../social-auth/social-auth.dataloader';
import { User } from '../../user/models/user.model';
import { UserDataloader } from '../../user/user.dataloader';
import { IDataLoaders, IDataLoaderService } from './dataloader.interface';

@Injectable()
export class DataloaderService implements IDataLoaderService {
  constructor(
    @Inject(UserDataloader) private readonly userLoader: IDataLoaderService,
    @Inject(NotificationDataloader)
    private readonly notificationLoader: IDataLoaderService,
    @Inject(SocialAuthDataloader)
    private readonly socialAuthLoader: IDataLoaderService,
    @Inject(JobTitleDataloader)
    private readonly jobTitleLoader: IDataLoaderService,
    @Inject(LecturerDataloader)
    private readonly lecturerLoader: IDataLoaderService,
    @Inject(CourseDataloader) private readonly courseLoader: IDataLoaderService,
    @Inject(SkillDataloader) private readonly skillLoader: IDataLoaderService,
    @Inject(ToolDataloader) private readonly toolLoader: IDataLoaderService,
    @Inject(CategoryDataloader)
    private readonly categoryLoader: IDataLoaderService,
    @Inject(BlogDataloader) private readonly blogLoader: IDataLoaderService
  ) {}

  createLoaders(currentUser: User): IDataLoaders {
    return {
      ...this.userLoader.createLoaders(),
      ...this.notificationLoader.createLoaders(currentUser),
      ...this.socialAuthLoader.createLoaders(),
      ...this.jobTitleLoader.createLoaders(),
      ...this.lecturerLoader.createLoaders(),
      ...this.courseLoader.createLoaders(),
      ...this.skillLoader.createLoaders(),
      ...this.categoryLoader.createLoaders(),
      ...this.toolLoader.createLoaders(),
      ...this.blogLoader.createLoaders()
    };
  }
}
