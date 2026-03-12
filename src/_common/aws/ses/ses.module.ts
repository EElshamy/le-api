import { Module } from '@nestjs/common';
import { SesService } from './services/ses.service';

@Module({
  providers: [SesService],
  exports: [SesService]
})
export class SesModule {}
