import { Module } from '@nestjs/common';
import { HelperModule } from '@src/_common/utils/helper.module';
import { FaqResolver } from './resolvers/faq.resolver';
import { FaqService } from './services/faq.service';

@Module({
  imports: [HelperModule],
  providers: [FaqService, FaqResolver],
  exports: [FaqService]
})
export class FaqModule {}
