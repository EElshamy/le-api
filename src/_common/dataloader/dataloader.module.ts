import { Module } from '@nestjs/common';
import { BlogModule } from '@src/blogs/blog.module';
import { CategoryModule } from '../../course-specs/category/category.module';
import { SkillModule } from '../../course-specs/skill/skill.module';
import { ToolModule } from '../../course-specs/tool/tool.module';
import { CourseModule } from '../../course/course.module';
import { JobTitleModule } from '../../job-title/job-title.module';
import { LecturerModule } from '../../lecturer/lecturer.module';
import { NotificationModule } from '../../notification/notification.module';
import { SocialAuthModule } from '../../social-auth/social-auth.module';
import { UserModule } from '../../user/user.module';
import { DataloaderService } from './dataloader.service';

@Module({
  imports: [
    NotificationModule,
    UserModule,
    LecturerModule,
    JobTitleModule,
    SocialAuthModule,
    CourseModule,
    ToolModule,
    CategoryModule,
    SkillModule,
    BlogModule
  ],
  providers: [DataloaderService],
  exports: [DataloaderService]
})
export class DataloaderModule {}
