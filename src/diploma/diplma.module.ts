import { Module } from '@nestjs/common';
import { BunnyModule } from '@src/_common/bunny/bunny.module';
import { UploaderModule } from '@src/_common/uploader/uploader.module';
import { HelperModule } from '@src/_common/utils/helper.module';
import { CategoryModule } from '@src/course-specs/category/category.module';
import { SkillModule } from '@src/course-specs/skill/skill.module';
import { ToolModule } from '@src/course-specs/tool/tool.module';
import { CourseModule } from '@src/course/course.module';
import { LecturerModule } from '@src/lecturer/lecturer.module';
import { PaymentModule } from '@src/payment/payment.module';
import { UserModule } from '@src/user/user.module';
import { DiplomaDetailResolver } from './diploma-detail.resolver';
import { DiplomaResolver } from './diploma.resolver';
import { DiplomaService } from './diploma.service';
import { DiplomaCategoryLoader } from './loaders/diploma-category.loader';
import { DiplomaLecturersLoader } from './loaders/diploma-lecturers.loader';
import { DiplomaProgramsLoader } from './loaders/diploma-programs.loader';
import { ProgramReviewsLoader } from './loaders/diploma-reviews.loader';
import { DiplomaSkillsLoader } from './loaders/diploma-skills.loader';
import { DiplomaToolsLoader } from './loaders/diploma-tools.loader';
import { DiplomaUsersLoader } from './loaders/diploma-users.loader';
import { CartModule } from '@src/cart/cart.module';
import { NotificationModule } from '@src/notification/notification.module';
import { DiplomaDeletionProcessor } from './processors/delete-diploma.processor';

@Module({
  imports: [
    CourseModule,
    CartModule,
    UploaderModule,
    HelperModule,
    LecturerModule,
    SkillModule,
    ToolModule,
    CategoryModule,
    BunnyModule,
    PaymentModule,
    NotificationModule,
    UserModule
  ],
  providers: [
    DiplomaResolver,
    DiplomaDetailResolver,
    DiplomaService,
    DiplomaSkillsLoader,
    DiplomaToolsLoader,
    DiplomaUsersLoader,
    DiplomaProgramsLoader,
    DiplomaLecturersLoader,
    DiplomaCategoryLoader,
    ProgramReviewsLoader,
    DiplomaDeletionProcessor
  ],
  exports: [DiplomaService]
})
export class DiplomaModule {}
