import { Module } from '@nestjs/common';
import { JobTitleService } from './job-title.service';
import { JobTitleResolver } from './job-title.resolver';
import { JobTitleDataloader } from './job-title.dataloader';
import { HelperModule } from '../_common/utils/helper.module';

@Module({
  imports: [HelperModule],
  providers: [JobTitleService, JobTitleResolver, JobTitleDataloader],
  exports: [JobTitleService, JobTitleDataloader]
})
export class JobTitleModule {}
