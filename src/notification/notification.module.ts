import { Module } from '@nestjs/common';
import { PusherModule } from '@src/_common/pusher/pusher.module';
import { NotificationDataloader } from './notification.dataloader';
import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';
import { PubSub } from '@src/_common/graphql/graphql.pubsub';
import { NotificationsCrons } from './notifications.crons';

@Module({
  imports: [PusherModule],
  providers: [
    PubSub,
    NotificationService,
    NotificationResolver,
    NotificationDataloader,
    NotificationsCrons
  ],
  exports: [NotificationService, NotificationDataloader]
})
export class NotificationModule {}
