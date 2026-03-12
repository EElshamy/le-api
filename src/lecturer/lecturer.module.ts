import { Module } from '@nestjs/common';
import { PaymentModule } from '@src/payment/payment.module';
import { UploaderModule } from '../_common/uploader/uploader.module';
import { HelperModule } from '../_common/utils/helper.module';
import { FieldOfTrainingModule } from '../field-of-training/field-of-training.module';
import { JobTitleModule } from '../job-title/job-title.module';
import { UserModule } from '../user/user.module';
import { LecturerDataloader } from './loaders/lecturer.dataloader';
import { LecturerRequestResolver } from './resolvers/lecturer-request.resolver';
import { LecturerResolver } from './resolvers/lecturer.resolver';
import { LecturerRequestService } from './services/lecturer-request.service';
import { LecturerService } from './services/lecturer.service';
import { LecturerTransformer } from './transformers/lecturer.transformer';
import { NotificationModule } from '@src/notification/notification.module';

@Module({
  imports: [
    FieldOfTrainingModule,
    UploaderModule,
    JobTitleModule,
    HelperModule,
    UserModule,
    NotificationModule,
    UserModule,
    // MailModule
    PaymentModule
  ],
  providers: [
    LecturerService,
    LecturerRequestResolver,
    LecturerRequestService,
    LecturerResolver,
    LecturerDataloader,
    LecturerTransformer
  ],
  exports: [LecturerService, LecturerDataloader]
})
export class LecturerModule {}
