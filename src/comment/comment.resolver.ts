import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import DataLoader from 'dataloader';
import { Auth } from '../_common/decorators/auth.decorator';
import { Loader } from '../_common/decorators/loader.decorator';
import { GqlContext } from '../_common/graphql/graphql-context.type';
import { GqlBooleanResponse } from '../_common/graphql/graphql-response.type';
import { Timestamp } from '../_common/graphql/timestamp.scalar';
import { NullablePaginatorInput } from '../_common/paginator/paginator.input';
import { CurrentUser } from '../auth/auth-user.decorator';
import { CourseInput } from '../course/inputs/course.input';
import { UserLoaders } from '../user/loaders/user.loader';
import { User } from '../user/models/user.model';
import { CommentService } from './comment.service';
import {
  CreateCommentInput,
  EditCommentInput
} from './inputs/create-comment.input';
import {
  CommentIdInput,
  NullableCommentFilterInput
} from './inputs/filter-comment.input';
import { NullableCommentSortInput } from './inputs/sort-comment.input';
import { CommentIsLikedLoader } from './loaders/comment-is-liked.loader';
import { CommentLikesLoader } from './loaders/comment-likers.loader';
import { RepliesLoader } from './loaders/comment-replies.loader';
import { FirstReplyCommentLoader } from './loaders/comment-reply.loader';
import { Comment } from './models/comment.model';
import {
  GqlCommentResponse,
  GqlCommentResponseConnection
} from './responses/comment.response';

@Resolver(Comment)
export class CommentResolver {
  constructor(private readonly commentService: CommentService) {}

  //** ---------------------  QUERIES  --------------------- */
  @Auth({ allow: 'authenticated' })
  @Query(() => GqlCommentResponseConnection)
  async comments(
    @Args() { courseId }: CourseInput,
    @Args() { sort }: NullableCommentSortInput,
    @Args() { paginate }: NullablePaginatorInput,
    @Args() { filter }: NullableCommentFilterInput,
    @Context() { currentUser }: GqlContext
  ) {
    if (sort) currentUser['commentsSortPreferences'] = sort;

    await this.commentService.isUserAssignedToCourseOrError(
      courseId,
      currentUser
    );
    return await this.commentService.getComments(
      currentUser,
      { courseId, ...filter },
      sort,
      paginate
    );
  }

  @Auth({ allow: 'authenticated' })
  @Query(() => GqlCommentResponse)
  async comment(@Args() { commentId }: CommentIdInput) {
    return await this.commentService.getComment(commentId);
  }

  // use this if you want the replies of a comment paginated
  @Auth({ allow: 'authenticated' })
  @Query(() => GqlCommentResponseConnection)
  async commentReplies(
    @Args('commentId') commentId: string,
    @Args() { paginate }: NullablePaginatorInput,
    @Context() { currentUser }: GqlContext
  ) {
    return await this.commentService.getCommentReplies(
      commentId,
      paginate,
      currentUser
    );
  }

  //** --------------------- MUTATIONS --------------------- */
  @Auth({ allow: 'authenticated' })
  @Mutation(() => GqlCommentResponse)
  async createComment(
    @CurrentUser() user: User,
    @Args('input') commentInput: CreateCommentInput
  ) {
    await this.commentService.isUserAssignedToCourseOrError(
      commentInput.courseId,
      user
    );
    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    return await this.commentService.createComment(user, commentInput);
  }

  @Auth({ allow: 'user' })
  @Mutation(() => GqlBooleanResponse)
  async likeComment(
    @CurrentUser() user: User,
    @Args() { commentId }: CommentIdInput
  ) {
    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    return await this.commentService.likeComment(user, commentId);
  }

  @Auth({ allow: 'user' })
  @Mutation(() => GqlBooleanResponse)
  async unlikeComment(
    @CurrentUser() user: User,
    @Args() { commentId }: CommentIdInput
  ) {
    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    return await this.commentService.unlikeComment(user, commentId);
  }

  @Auth({ allow: 'user' })
  @Mutation(() => GqlBooleanResponse)
  async toggleLikeComment(
    @CurrentUser() user: User,
    @Args() { commentId }: CommentIdInput
  ) {
    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    return await this.commentService.toggleLikeComment(user, commentId);
  }

  @Auth({ allow: 'authenticated' })
  @Mutation(() => GqlBooleanResponse)
  async deleteComment(
    @CurrentUser() user: User,
    @Args() { commentId }: CommentIdInput
  ) {
    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    return await this.commentService.deleteComment(user, commentId);
  }

  @Auth({ allow: 'authenticated' })
  @Mutation(() => GqlCommentResponse)
  async editComment(
    @CurrentUser() user: User,
    @Args('input') commentInput: EditCommentInput
  ) {
    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    return await this.commentService.editComment(user, commentInput);
  }
  //** ------------------ RESOLVER FIELDS ------------------ */
  @ResolveField(() => Comment, { nullable: true })
  firstReplyComment(
    @Parent() comment: Comment,
    @Loader(FirstReplyCommentLoader)
    firstReplyCommentLoader: DataLoader<any, any>
  ) {
    if (comment['firstReplyComment']) return comment['firstReplyComment'];
    else return firstReplyCommentLoader.load(comment.id);
  }

  @ResolveField(() => [Comment], { nullable: true })
  replies(
    @Parent() comment: Comment,
    @Loader(RepliesLoader) repliesLoader: DataLoader<any, any>
  ) {
    if (comment.replies) return comment.replies;
    else return repliesLoader.load(comment.id);
  }

  @ResolveField(() => User, { nullable: true })
  user(
    @Parent() comment: Comment,
    @Loader(UserLoaders) userLoaders: DataLoader<any, any>
  ) {
    if (comment.user) return comment.user;
    if (comment.userId) return userLoaders.load(comment.userId);
    return null;
  }

  @ResolveField(() => [User])
  likedBy(
    @Parent() comment: Comment,
    @Loader(CommentLikesLoader) commentLikesLoader: DataLoader<any, any>
  ) {
    if (comment.likedBy) return comment.likedBy;
    else return commentLikesLoader.load(comment.id);
  }

  @ResolveField(() => Boolean)
  isLiked(
    @Parent() comment: Comment,
    @Loader(CommentIsLikedLoader) commentIsLikedLoader: DataLoader<any, any>
  ) {
    return commentIsLikedLoader.load(comment.id);
  }

  //Sorry, but frontend need it ??
  @ResolveField(() => Boolean)
  hasReply() {
    return false;
  }

  // @ResolveField(() => [File], { nullable: true })
  // attachments(
  //   @Parent() comment: Comment,
  //   @Loader(AttachmentLoader) attachmentLoader: DataLoader<any, any>
  // ) {
  //   return attachmentLoader.load(comment.id);
  // }

  @ResolveField(() => Timestamp)
  createdAt(@Parent() comment: Comment) {
    return new Date(comment.createdAt).getTime();
  }
}
