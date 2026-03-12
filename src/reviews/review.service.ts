import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { Diploma } from '@src/diploma/models/diploma.model';
import { User } from '@src/user/models/user.model';
import { UserRoleEnum } from '@src/user/user.enum';
import { Op, Sequelize } from 'sequelize';
import { AddReviewInput, ReviewsFilter } from '../course/inputs/review.input';
import { SearchSortInput } from '../course/inputs/search.types';
import { Course } from '../course/models/course.model';
import { Review } from './review.model';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { UpdateReviewInput } from './inputs/update-review.input';

@Injectable()
export class ReviewService {
  constructor(
    @Inject(Repositories.ReviewsRepository)
    private readonly reviewRepo: IRepository<Review>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomaRepo: IRepository<Diploma>,
    @InjectQueue('UpdateRatings') private readonly updateRatingsQueue: Queue
  ) {}
  async addReview(input: AddReviewInput, currentUser: User): Promise<Review> {
    const { learningProgramId, learningProgramType } = input;

    await this.findReviewByProgramIdWithError(learningProgramId, currentUser);

    const learningProgram = await this.getLearningProgramByIdAndType(
      learningProgramId,
      learningProgramType
    );

    if (!learningProgram) {
      throw new BaseHttpException(ErrorCodeEnum.LEARNING_PROGRAM_DOESNT_EXIST);
    }

    console.log(input);

    const review = await this.reviewRepo.createOne({
      ...input,
      userId: currentUser?.id
    });

    await this.updateRatingsQueue.add('handleUpdateRatings', {
      learningProgramId,
      learningProgramType
    });

    return review;
  }

  async deleteReview(reviewId: string, currentUser: User): Promise<number> {
    const review = await this.findReviewOrError(reviewId, currentUser);
    const { learningProgramId, learningProgramType } = review;
    if (
      !(
        (currentUser.role === UserRoleEnum.USER &&
          review?.userId === currentUser?.id) ||
        currentUser.role === UserRoleEnum.LECTURER ||
        currentUser.role === UserRoleEnum.ADMIN
      )
    ) {
      throw new BaseHttpException(ErrorCodeEnum.PERMISSION_DENIED);
    }

    const deleted = await this.reviewRepo.deleteAll({ id: reviewId });
    await this.updateRatingsQueue.add('handleUpdateRatings', {
      learningProgramId,
      learningProgramType
    });
    return deleted;
  }

  async review(userId: string, learningProgramId: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      userId,
      learningProgramId
    });

    return review;
  }
  async reviews(
    filter: ReviewsFilter,
    paginator?: NullablePaginatorInput,
    sort?: SearchSortInput
  ): Promise<PaginationRes<Review>> {
    const reviews = await this.reviewRepo.findPaginated(
      {
        ...(filter?.filter?.learningProgramId && {
          learningProgramId: filter.filter.learningProgramId
        }),
        ...(filter?.filter?.userId && {
          userId: filter.filter.userId
        }),
        ...(filter?.filter?.rating && {
          rating: filter?.filter?.rating
        })
      },
      [
        [
          Sequelize.col(sort?.sort?.sortBy || 'createdAt'),
          sort?.sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginator?.paginate?.page || 1,
      paginator?.paginate?.limit || 15,
      [
        {
          model: User,
          as: 'user'
        }
      ]
    );
    return reviews;
  }
  async findReviewByProgramIdWithError(
    learningProgramId: string,
    currentUser?: User
  ): Promise<Review> {
    const userId = currentUser?.id;
    const review = await this.reviewRepo.findOne({
      learningProgramId,
      ...(userId && { userId })
    });

    if (review) {
      throw new BaseHttpException(ErrorCodeEnum.REVIEW_ALREADY_EXISTS);
    }

    return review;
  }

  async findReviewOrError(
    reviewId: string,
    currentUser?: User
  ): Promise<Review> {
    let review: Review;
    if (
      currentUser?.role === UserRoleEnum.ADMIN ||
      currentUser?.role === UserRoleEnum.LECTURER
    ) {
      review = await this.reviewRepo.findOne({
        id: reviewId
      });
    } else {
      review = await this.reviewRepo.findOne({
        id: reviewId,
        ...(currentUser && { userId: currentUser?.id })
      });
    }

    if (!review) {
      throw new BaseHttpException(ErrorCodeEnum.REVIEW_DOESNT_EXIST);
    }
    return review;
  }

  async getLearningProgramByIdAndType(
    learningProgramId: string,
    learningProgramType: string
  ): Promise<Course | Diploma> {
    switch (learningProgramType) {
      case 'Course':
      case 'WorkShop':
        return this.courseRepo.findOne({
          id: learningProgramId
        });
      case 'Diploma':
        return this.diplomaRepo.findOne({
          id: learningProgramId
        });
    }
  }
  async updateReview(
    input: UpdateReviewInput,
    currentUser: User
  ): Promise<Review> {
    const { reviewId, rating, review } = input;

    const existingReview = await this.findReviewOrError(reviewId, currentUser);

    if (
      !(
        (currentUser.role === UserRoleEnum.USER &&
          existingReview.userId === currentUser.id) ||
        currentUser.role === UserRoleEnum.LECTURER ||
        currentUser.role === UserRoleEnum.ADMIN
      )
    ) {
      throw new BaseHttpException(ErrorCodeEnum.PERMISSION_DENIED);
    }

    await this.reviewRepo.updateAll(
      { id: reviewId },
      {
        ...(rating !== undefined && { rating }),
        ...(review !== undefined && { review })
      }
    );

    await this.updateRatingsQueue.add('handleUpdateRatings', {
      learningProgramId: existingReview.learningProgramId,
      learningProgramType: existingReview.learningProgramType
    });

    return await this.reviewRepo.findOne({ id: reviewId });
  }

  async updateNegativeReviews(): Promise<boolean> {
    await this.reviewRepo.updateAll({ rating: { [Op.lt]: 0 } }, { rating: 0 });
    return true;
  }
}
