import { Module } from '@nestjs/common';
import { UploaderModule } from '@src/_common/uploader/uploader.module';
import { HelperModule } from '@src/_common/utils/helper.module';
import { BlogCategoryResolver } from './blog-category/blog-category.resolver';
import { BlogCategoryService } from './blog-category/blog-category.service';
import { BlogTagResolver } from './blog-tag/tags.resolver';
import { BlogTagService } from './blog-tag/tags.service';
import { BlogResolver } from './blog/blog.resolver';
import { BlogService } from './blog/blog.service';
import { AuthorsLoader } from './blog/loaders/authors.loader';
import { BlogDataloader } from './blog/loaders/blog.dataloader';
import { NotificationModule } from '@src/notification/notification.module';

@Module({
  imports: [UploaderModule, HelperModule, NotificationModule],
  providers: [
    BlogResolver,
    BlogService,
    BlogCategoryResolver,
    BlogCategoryService,
    BlogTagResolver,
    BlogTagService,
    BlogDataloader,
    AuthorsLoader
  ],
  exports: [
    BlogService,
    BlogCategoryService,
    BlogTagService,
    BlogDataloader,
    AuthorsLoader
  ]
})
export class BlogModule {}
