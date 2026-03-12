import { Module } from '@nestjs/common';
import { UploaderModule } from '@src/_common/uploader/uploader.module';
import { HelperModule } from '@src/_common/utils/helper.module';
import { ContactMessageResolver } from './resolvers/contact-message.resolver';
import { ContactMessageService } from './services/contact-message.service';
import { NotificationModule } from '@src/notification/notification.module';

@Module({
  imports: [HelperModule, UploaderModule, NotificationModule],
  providers: [ContactMessageService, ContactMessageResolver],
  exports: [ContactMessageService]
})
export class ContactMessageModule {}
