import { Module } from '@nestjs/common';
import { HelperModule } from '@src/_common/utils/helper.module';
import { ReportResolver } from './report.resolver';
import { ReportService } from './report.service';

@Module({
  imports: [HelperModule],
  providers: [ReportResolver, ReportService],
  exports: []
})
export class ReportModule {}
