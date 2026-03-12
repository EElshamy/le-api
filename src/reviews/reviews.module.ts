import { Module } from '@nestjs/common';
import { ReviewResolver } from './review.resolver';
import { ReviewService } from './review.service';
import { ReviewsUsersDataloader } from './reviews-users.dataloader';
import { HelperService } from '@src/_common/utils/helper.service';
import { S3Module } from '@src/_common/aws/s3/s3.module';
import { SpacesModule } from '@src/_common/digitalocean/spaces.module';

@Module({
  imports: [S3Module , SpacesModule],
  controllers: [],
  providers: [
    HelperService,
    ReviewResolver,
    ReviewService,
    ReviewsUsersDataloader
  ],
  exports: [ReviewResolver, ReviewService, ReviewsUsersDataloader]
})
export class ReviewsModule {}
