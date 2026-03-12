import { Module } from '@nestjs/common';
import { ToolResolver } from './tool.resolver';
import { ToolService } from './tool.service';
import { UploaderModule } from '../../_common/uploader/uploader.module';
import { ToolDataloader } from './tool.dataloader';

@Module({
  imports: [UploaderModule],
  providers: [ToolService, ToolResolver, ToolDataloader],
  exports: [ToolService, ToolDataloader]
})
export class ToolModule {}
