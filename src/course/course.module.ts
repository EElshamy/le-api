import { Module } from '@nestjs/common';
import { S3Module } from '@src/_common/aws/s3/s3.module';
import { MailService } from '@src/_common/mail/mail.service';
import { CartModule } from '@src/cart/cart.module';
import { CertificationService } from '@src/certification/certification.service';
import { DiplomaService } from '@src/diploma/diploma.service';
import { PaymentModule } from '@src/payment/payment.module';
import { SearchService } from '@src/search/search.service';
import { UserModule } from '@src/user/user.module';
import { BunnyModule } from '../_common/bunny/bunny.module';
import { UploaderModule } from '../_common/uploader/uploader.module';
import { HelperModule } from '../_common/utils/helper.module';
import { CategoryModule } from '../course-specs/category/category.module';
import { SkillModule } from '../course-specs/skill/skill.module';
import { ToolModule } from '../course-specs/tool/tool.module';
import { LecturerModule } from '../lecturer/lecturer.module';
import { CourseDataloader } from './loaders/course.dataloaders';
import { ReviewsUsersDataloader } from '../reviews/reviews-users.dataloader';
import { UserAssignedCoursesLoader } from './loaders/user-assigned-courses.loader';
import { PricingCalcsProcessor } from './processors/pricing-calcs.processor';
import { CourseDetailsResolver } from './resolvers/course-details.resolver';
import { CourseResolver } from './resolvers/course.resolver';
import { LessonResolver } from './resolvers/lesson.resolver';
import { ReviewResolver } from '../reviews/review.resolver';
import { SectionResolver } from './resolvers/section.resolver';
import { CourseService } from './services/course.service';
import { LessonService } from './services/lesson.service';
import { ReviewService } from '../reviews/review.service';
import { SectionService } from './services/section.service';
import { UpdateRatingsProcessor } from './processors/update-ratings.processor';
import { ReviewsModule } from '@src/reviews/reviews.module';
import { CertificationModule } from '@src/certification/certification.module';
import { NotificationModule } from '@src/notification/notification.module';
import { SpacesModule } from '@src/_common/digitalocean/spaces.module';
import { QuizModule } from '@src/quiz/quiz.module';
import { UserAssignmentsExpirationCron } from './crons/user-assignments-expiration.cron';
import { UserViewsProcessor } from './processors/user-views.processor';

@Module({
  imports: [
    UploaderModule,
    HelperModule,
    LecturerModule,
    SkillModule,
    ToolModule,
    CategoryModule,
    BunnyModule,
    PaymentModule,
    UserModule,
    CertificationModule,
    S3Module,
    SpacesModule,
    CartModule,
    NotificationModule,
    ReviewsModule,
    CartModule,
    QuizModule
  ],
  providers: [
    CourseDataloader,
    CourseService,
    CourseResolver,
    CourseDetailsResolver,
    ReviewsUsersDataloader,
    SectionService,
    SectionResolver,
    LessonResolver,
    LessonService,
    ReviewService,
    SearchService,
    CertificationService,
    UserAssignedCoursesLoader,
    PricingCalcsProcessor,
    UpdateRatingsProcessor,
    DiplomaService,
    UserAssignmentsExpirationCron,
    UserViewsProcessor
  ],
  exports: [
    CourseDataloader,
    CourseService,
    ReviewsUsersDataloader,
    SearchService,
    CourseResolver,
    SectionService,
    SectionResolver,
    LessonResolver,
    LessonService,
    ReviewService
  ]
})
export class CourseModule {}
