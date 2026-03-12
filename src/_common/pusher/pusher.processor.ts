import { Process, Processor } from '@nestjs/bull';
import { PusherService } from './pusher.service';

@Processor('pusher')
export class PusherProcessor {
  constructor(private readonly pusherService: PusherService) {}
  @Process('pusher')
  async handlePusher(job: any) {
    const res = await this.pusherService.push(
      job.data?.toUsers,
      job?.data?.payloadData,
      job?.data?.fromUser,
      job?.data?.notificationParentId,
      job?.data?.notificationParentType,
      job?.data?.scheduledTime,
      job?.data?.specificDevice
    );
    return res;
  }
}
