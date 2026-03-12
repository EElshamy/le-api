import { Global, Module } from '@nestjs/common';
import { AppCheckService } from './services/app-check.service';

@Global()
@Module({
  imports: [],
  providers: [AppCheckService],
  exports: [AppCheckService],
})
export class AppCheckModule {}
