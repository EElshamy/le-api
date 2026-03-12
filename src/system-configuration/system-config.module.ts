import { Module } from '@nestjs/common';
import { SysConfigResolver } from './resolvers/sys-config.resolver';
import { SysConfigService } from './services/sys-config.service';

@Module({
  imports: [],
  providers: [SysConfigResolver, SysConfigService],
  exports: [SysConfigService]
})
export class SystemConfigModule {}
