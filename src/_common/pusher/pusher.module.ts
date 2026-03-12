import { Module, OnModuleInit } from '@nestjs/common';
import { PusherService } from './pusher.service';
import { PusherProcessor } from './pusher.processor';

@Module({
  providers: [PusherService, PusherProcessor],
  exports: [PusherService]
})
export class PusherModule implements OnModuleInit {
  onModuleInit(): void {
    // console.log('pusher module is alive :)');
  }
}
