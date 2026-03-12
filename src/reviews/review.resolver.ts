import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import {
  generateGqlResponseType,
  GqlBooleanResponse
} from '@src/_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { AuthGuard } from '@src/auth/auth.guard';
import { User } from '@src/user/models/user.model';
import { AddReviewInput, ReviewsFilter } from '../course/inputs/review.input';
import { SearchSortInput } from '../course/inputs/search.types';
import { Review } from './review.model';
import { ReviewService } from './review.service';
import { Loader } from '@src/_common/decorators/loader.decorator';
import { ReviewsUsersDataloader } from './reviews-users.dataloader';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import DataLoader from 'dataloader';
import { UpdateReviewInput } from './inputs/update-review.input';

//Responses:
const GqlReviewResponse = generateGqlResponseType(Review);
const GqlReviewsResponse = generateGqlResponseType([Review]);

//! TODO: we need to discuss this ASAP
@Resolver(() => Review)
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}
  //** --------------------- MUTATIONS --------------------- */
  @UseGuards(AuthGuard)
  @Mutation(() => GqlReviewResponse)
  async addReview(
    @Args('input') input: AddReviewInput,
    @CurrentUser() currentUser: User
  ): Promise<Review> {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.reviewService.addReview(input, currentUser);
  }
  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  async deleteReview(
    @Args('reviewId') reviewId: string,
    @CurrentUser() currentUser: User
  ): Promise<number> {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }
    return await this.reviewService.deleteReview(reviewId, currentUser);
  }
  @Mutation(() => GqlBooleanResponse)
  async updateNegativeReviews(): Promise<boolean> {
    return await this.reviewService.updateNegativeReviews();
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlReviewResponse)
  async updateReview(
    @Args('input') input: UpdateReviewInput,
    @CurrentUser() currentUser: User
  ): Promise<Review> {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.reviewService.updateReview(input, currentUser);
  }
  //** --------------------- QUERIES --------------------- */
  @Query(() => GqlReviewsResponse)
  async reviews(
    @Args() filter?: ReviewsFilter,
    @Args() paginator?: NullablePaginatorInput,
    @Args() sort?: SearchSortInput
  ): Promise<PaginationRes<Review>> {
    return await this.reviewService.reviews(filter, paginator, sort);
  }
  //** --------------------- DATALOADERS --------------------- */
  @ResolveField(() => User, { nullable: true })
  async user(
    @Parent() review: Review,
    @Loader(ReviewsUsersDataloader)
    reviewsUsersDataloader: DataLoader<string, User>
  ): Promise<User | null> {
    return await reviewsUsersDataloader.load(review.id);
  }
}
