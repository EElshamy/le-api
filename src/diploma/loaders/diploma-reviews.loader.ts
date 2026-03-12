import { Inject } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { NestDataLoader } from '@src/_common/types/loader.interface';
import { Review } from '@src/reviews/review.model';
import * as DataLoader from 'dataloader';

export class ProgramReviewsLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.ReviewsRepository)
    private readonly reviewsRepo: IRepository<Review>
  ) {}

  generateDataLoader() {
    return new DataLoader(async (progarmsIds: string[]) => {
      return this.reviewsByDiplomaIds(progarmsIds);
    });
  }

  async reviewsByDiplomaIds(progarmsIds: string[]): Promise<any> {
    const reviews = await this.reviewsRepo.findAll({
      learningProgramId: progarmsIds
    });

    const res = progarmsIds.map(d =>
      reviews.filter(r => r.learningProgramId === d)
    );
    return res;
  }
}
