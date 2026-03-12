import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { Sequelize } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { Review } from '../../reviews/review.model';
import { Course } from '../models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';

@Processor('UpdateRatings')
export class UpdateRatingsProcessor {
  constructor(
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly Sequelize: Sequelize,
    @Inject(Repositories.ReviewsRepository)
    private readonly reviewRepo: IRepository<Review>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomaRepo: IRepository<Diploma>
  ) {}

  @Process('handleUpdateRatings')
  async handleUpdateRatings(job: any) {
    console.log('job', job.data);
    await this.updateRatings(
      job.data.learningProgramId,
      job.data.learningProgramType
    );
  }
  async calculateRatings(learningProgramId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    totalNumberOfRatings: number;
  }> {
    const averageAndSum = await this.reviewRepo.findAll(
      { learningProgramId },
      [],
      [],
      [
        [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating'],
        [Sequelize.fn('SUM', Sequelize.col('rating')), 'totalRatings']
      ]
    );

    console.log(averageAndSum);

    const totalNumberOfRatings = (
      await this.reviewRepo.findAll({
        learningProgramId
      })
    )?.length;

    return {
      averageRating: averageAndSum[0].dataValues.averageRating || 0,
      totalRatings: averageAndSum[0].dataValues.totalRatings || 0,
      totalNumberOfRatings
    };
  }

  async updateRatings(
    learningProgramId: string,
    learningProgramType: LearningProgramTypeEnum
  ): Promise<boolean> {
    const { averageRating, totalNumberOfRatings, totalRatings } =
      await this.calculateRatings(learningProgramId);

    const repo =
      learningProgramType === LearningProgramTypeEnum.DIPLOMA ?
        this.diplomaRepo
      : this.courseRepo;
    await repo.updateOne(
      { id: learningProgramId },
      {
        averageRating,
        totalNumberOfRatings,
        totalRatings
      }
    );
    return true;
  }
}
