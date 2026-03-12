import { Module } from '@nestjs/common';
import { HelperModule } from '@src/_common/utils/helper.module';
import { AppConfigurationResolver } from './app-configuration.resolver';
import { AppConfigurationService } from './app-configuration.service';

@Module({
  imports: [HelperModule],
  providers: [AppConfigurationService, AppConfigurationResolver],
  exports: [AppConfigurationService]
})
export class AppConfigurationModule {}
