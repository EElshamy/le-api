import { Module } from '@nestjs/common';
import { CategoryResolver } from './category.resolver';
import { CategoryService } from './category.service';
import { CategoryDataloader } from './category.dataloader';
import { UploaderModule } from '@src/_common/uploader/uploader.module';

@Module({
  imports: [UploaderModule],
  providers: [CategoryService, CategoryResolver, CategoryDataloader],
  exports: [CategoryService, CategoryDataloader]
})
export class CategoryModule {}
