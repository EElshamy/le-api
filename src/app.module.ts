import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PinoLogger } from 'nestjs-pino';
import { S3Module } from './_common/aws/s3/s3.module';
import { SesModule } from './_common/aws/ses/ses.module';
import { NestBullModule } from './_common/bull/bull.module';
import { BunnyModule } from './_common/bunny/bunny.module';
import { ContextModule } from './_common/context/context.module';
import { CountryModule } from './_common/country/country.module';
import { DatabaseModule } from './_common/database/database.module';
import { DataloaderModule } from './_common/dataloader/dataloader.module';
import { HttpExceptionFilter } from './_common/exceptions/exception-filter';
import { ValidationPipe } from './_common/exceptions/validation.pipe';
import { FileAuthMiddleware } from './_common/files-auth/files-auth.middelware';
import { FileAuthModule } from './_common/files-auth/files-auth.module';
import { GqlResponseInterceptor } from './_common/graphql/graphql-response.interceptor';
import { GqlConfigService } from './_common/graphql/graphql.provider';
import { PubSub } from './_common/graphql/graphql.pubsub';
import { JSON } from './_common/graphql/json.scalar';
import { MoneyScalar } from './_common/graphql/money.scaler';
import { ComplexityPlugin } from './_common/graphql/query-complexity-plugin';
import { Timestamp } from './_common/graphql/timestamp.scalar';
import { DataLoaderInterceptor } from './_common/interceptors/data-loader.interceptor';
import { LoggerModule } from './_common/logger/logger.module';
import { MailModule } from './_common/mail/mail.module';
import { PdfModule } from './_common/pdf/pdf.module';
import { PusherModule } from './_common/pusher/pusher.module';
import { FileModelEnum } from './_common/uploader/file.enum';
import { UploaderModule } from './_common/uploader/uploader.module';
import { HelperModule } from './_common/utils/helper.module';
import { AppConfigurationModule } from './app-configuration/app-configuration.module';
import { AuthModule } from './auth/auth.module';
import { BlogModule } from './blogs/blog.module';
import { CartModule } from './cart/cart.module';
import { CertificationModule } from './certification/certification.module';
import { CommentModule } from './comment/comment.module';
import { ContactMessageModule } from './contact-message/contact-message.module';
import { CategoryModule } from './course-specs/category/category.module';
import { SkillModule } from './course-specs/skill/skill.module';
import { ToolModule } from './course-specs/tool/tool.module';
import { CourseModule } from './course/course.module';
import { DashboardEmailModule } from './dashboard-email/dashboard-email.module';
import { DiplomaModule } from './diploma/diplma.module';
import { LanguageMiddleware } from './diploma/middlewares/lang.middleware';
import { FaqModule } from './faq/faq.module';
import { FieldOfTrainingModule } from './field-of-training/field-of-training.module';
import { JobTitleModule } from './job-title/job-title.module';
import { NotificationModule } from './notification/notification.module';
import { PolicyModule } from './policy/policy.module';
import { ReportModule } from './report/report.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SearchModule } from './search/search.module';
import { SecurityGroupModule } from './security-group/security-group.module';
import { SocialAuthModule } from './social-auth/social-auth.module';
import { SystemConfigModule } from './system-configuration/system-config.module';
import { UserModule } from './user/user.module';
import { QuizModule } from './quiz/quiz.module';
import { SpacesModule } from './_common/digitalocean/spaces.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppThrottlerGuard } from './_common/guards/app-throttler.guard';
import { AppCheckGuard } from './_common/app-check/guards/app-check.guard';
import { AppCheckModule } from './_common/app-check/app-check.module';
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100
        }
      ]
    }),
    EventEmitterModule.forRoot({
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
      global: true
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useClass: GqlConfigService,
      imports: [ContextModule, DataloaderModule]
    }),
    ServeStaticModule.forRoot({
      rootPath: 'public',
      //NOTE : disabled for serving static files for mail resources
      serveStaticOptions: {
        setHeaders(res) {
          res.set('Cross-Origin-Resource-Policy', '*');
          res.set('Access-Control-Allow-Origin', '*');
        }
      }
    }),
    LoggerModule,
    HelperModule,
    PusherModule,
    UploaderModule,
    NotificationModule,
    SecurityGroupModule,
    AuthModule,
    UserModule,
    AppConfigurationModule,
    CountryModule,
    ContactMessageModule,
    FaqModule,
    CartModule,
    SocialAuthModule,
    NestBullModule,
    JobTitleModule,
    FieldOfTrainingModule,
    ToolModule,
    CategoryModule,
    SkillModule,
    CourseModule,
    S3Module,
    SesModule,
    SearchModule,
    MailModule,
    PdfModule,
    FileAuthModule,
    ReportModule,
    BunnyModule,
    BlogModule,
    CertificationModule,
    DiplomaModule,
    CommentModule,
    SpacesModule,
    // SiteNotificationsModule,
    ServeStaticModule.forRoot({
      rootPath: 'public',
      //NOTE : disabled for serving static files for mail resources
      serveStaticOptions: {
        setHeaders(res) {
          res.set('Cross-Origin-Resource-Policy', '*');
          res.set('Access-Control-Allow-Origin', '*');
        }
      }
    }),
    SystemConfigModule,
    DashboardEmailModule,
    ReviewsModule,
    PolicyModule,
    QuizModule,
    AnalyticsModule,
    AppCheckModule,
  ],
  providers: [
    PubSub,
    ComplexityPlugin,
    Timestamp,
    JSON,
    MoneyScalar,
    { provide: APP_PIPE, useClass: ValidationPipe },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (logger: PinoLogger): GqlResponseInterceptor<unknown> =>
        new GqlResponseInterceptor(logger),
      inject: [PinoLogger]
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DataLoaderInterceptor
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: AppCheckGuard
    // }
  ]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(FileAuthMiddleware)
      .forRoutes(
        ...Object.keys(FileModelEnum).map(val => ({
          path: `${FileModelEnum[val]}/*`,
          method: RequestMethod.GET
        })),

        { path: 'default/*', method: RequestMethod.GET }
      )
      .apply(LanguageMiddleware)
      .forRoutes('*');
  }
}
