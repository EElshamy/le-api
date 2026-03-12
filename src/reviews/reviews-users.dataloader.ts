import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { NestDataLoader } from '@src/_common/types/loader.interface';
import { HelperService } from '@src/_common/utils/helper.service';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { Review } from './review.model';

@Injectable()
export class ReviewsUsersDataloader implements NestDataLoader {
  constructor(
    @Inject(Repositories.ReviewsRepository)
    private readonly reviewsRepo: IRepository<Review>,
    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>,
    private readonly helper: HelperService
  ) {}

  generateDataLoader(currentUser?: User): DataLoader<string, User | null> {
    return new DataLoader(async (reviewIds: string[]) => {
      return this.usersByReviewsIds(reviewIds);
    });
  }

  async usersByReviewsIds(reviewIds: string[]): Promise<(User | null)[]> {
    const reviews = await this.reviewsRepo.findAll({
      id: { [Op.in]: reviewIds }
    });

    const userIds = reviews.map(r => r.userId);

    const users = await this.usersRepo.findAll({
    id: { [Op.in]: userIds } 
    });

    const reviewMap = new Map(reviews.map(r => [r.id, r]));
    const userMap = new Map(users.map(u => [u.id, u]));

    return reviewIds.map(reviewId => {
      const review = reviewMap.get(reviewId);
      if (!review) return null;
      return userMap.get(review.userId) || null;
    });
  }
}
