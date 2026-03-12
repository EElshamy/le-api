import { Module } from '@nestjs/common';
import { ActiveUsersHistoryService } from './services/active-users.service';

@Module({
  providers: [ActiveUsersHistoryService],
  exports: [ActiveUsersHistoryService]
})
export class ActiveUsersModule {}
