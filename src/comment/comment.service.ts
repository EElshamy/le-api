import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '../_common/database/database-repository.enum';
import { Comment } from './models/comment.model';
import { User } from '../user/models/user.model';
import { IRepository } from '../_common/database/repository.interface';
import {
  CreateCommentInput,
  EditCommentInput
} from './inputs/create-comment.input';
import { CommentTransformer } from './transformers/comment.transformer';
import { CommentFilterInput } from './inputs/filter-comment.input';
import { CommentSortInput } from './inputs/sort-comment.input';
import { PaginatorInput } from '../_common/paginator/paginator.input';
import { CommentSortEnum } from './enums/comment.enum';
import { CourseInput } from '../course/inputs/course.input';
import { SortTypeEnum } from '../_common/paginator/paginator.types';
import { BaseHttpException } from '../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../_common/exceptions/error-code.enum';
import { CommentLikes } from './models/comment-like.model';
import { Op } from 'sequelize';
import { UserRoleEnum } from '../user/user.enum';
import { UsersAssignment } from '@src/course/models/user-assignments.model';

@Injectable()
export class CommentService {
  constructor(
    @Inject(Repositories.CommentLikesRepository)
    private readonly commentLikesRepo: IRepository<CommentLikes>,
    @Inject(Repositories.CommentsRepository)
    private readonly commentRepo: IRepository<Comment>,
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly usersAssignmentsRepo: IRepository<UsersAssignment>,
    private readonly commentTransformer: CommentTransformer
  ) {}

  async getComments(
    currentUser: User,
    filter: CommentFilterInput & CourseInput,
    sort: CommentSortInput = {
      sortBy: CommentSortEnum.createdAt,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = { page: 1, limit: 15 }
  ) {
    const { courseId } = filter;
    const { sortBy, sortType } = sort;
    const { page, limit } = paginate;

    const commonWhereOptions = {
      courseId,
      parentCommentId: null,
      ...(currentUser.role !== UserRoleEnum.ADMIN && { isHidden: false })
    };

    const userInclude = {
      model: User,
      as: 'user',
      required: currentUser.role !== UserRoleEnum.ADMIN,
      ...(currentUser.role !== UserRoleEnum.ADMIN && {
        where: {
          isDeleted: false,
          isBlocked: false
        }
      })
    };
    return await this.commentRepo.findPaginated(
      commonWhereOptions,
      [[sortBy, sortType]],
      page,
      limit,
      [userInclude]
    );
  }

  async getComment(commentId: string) {
    return await this.commentRepo.findOne({
      id: commentId
    });
  }

  async createComment(user: User, commentInput: CreateCommentInput) {
    const comment = await this.commentTransformer.createComment(
      commentInput,
      user
    );
    return await this.commentRepo.createOne(comment);
  }

  async likeComment(user: User, commentId: string) {
    const comment = await this.commentRepo.findOne({ id: commentId });
    if (!comment) throw new BaseHttpException(ErrorCodeEnum.COMMENT_NOT_FOUND);

    const isLiked = await this.commentLikesRepo.findOne({
      userId: user.id,
      commentId
    });

    if (isLiked) return true;

    await this.commentLikesRepo.createOne({ userId: user.id, commentId });
    await this.commentRepo.updateOne(
      { id: commentId },
      { numberOfLikes: comment.numberOfLikes + 1 }
    );
    return true;
  }

  async unlikeComment(user: User, commentId: string) {
    const comment = await this.commentRepo.findOne({ id: commentId });
    if (!comment) throw new BaseHttpException(ErrorCodeEnum.COMMENT_NOT_FOUND);

    const isLiked = await this.commentLikesRepo.findOne({
      userId: user.id,
      commentId
    });

    if (!isLiked) return true;

    await this.commentLikesRepo.deleteAll({ userId: user.id, commentId });
    await this.commentRepo.updateOne(
      { id: commentId, numberOfLikes: { [Op.gt]: 0 } },
      { numberOfLikes: comment.numberOfLikes - 1 }
    );
    return true;
  }

  async deleteComment(user: User, commentId: string) {
    const comment = await this.commentRepo.findOne({ id: commentId });
    if (!comment) throw new BaseHttpException(ErrorCodeEnum.COMMENT_NOT_FOUND);

    if (user.role == UserRoleEnum.USER && comment.userId !== user.id)
      throw new BaseHttpException(ErrorCodeEnum.MESSAGE_FORBIDDEN);

    const deleteCommentWithChildren = async (id: string) => {
      const children = await this.commentRepo.findAll({
        parentCommentId: id
      });

      for (const child of children) {
        await deleteCommentWithChildren(child.id);
      }

      await this.commentRepo.deleteAll({ id });
    };

    await deleteCommentWithChildren(commentId);

    return true;
  }

  async editComment(user: User, input: EditCommentInput) {
    const comment = await this.commentRepo.findOne({ id: input.commentId });
    if (!comment) throw new BaseHttpException(ErrorCodeEnum.COMMENT_NOT_FOUND);

    if (comment.userId !== user.id)
      throw new BaseHttpException(ErrorCodeEnum.UNAUTHORIZED_To_EDIT_COMMENT);

    await this.commentRepo.updateOne(
      { id: comment.id },
      { content: input.content }
    );
    const newComment = await this.commentRepo.findOne({ id: comment.id });
    return newComment;
  }

  async getCommentReplies(
    commentId: string,
    paginate: PaginatorInput,
    currentUser: User
  ) {
    const { page, limit } = paginate;

    // const userInclude = {
    //   model: User,
    //   as: 'user',
    //   required: currentUser.role !== UserRoleEnum.ADMIN,
    //   ...(currentUser.role !== UserRoleEnum.ADMIN && {
    //     where: {
    //       isDeleted: false,
    //       isBlocked: false
    //     }
    //   })
    // };

    // return await this.commentRepo.findPaginated(
    //   { parentCommentId: commentId, isHidden: false },
    //   [['createdAt', 'DESC']],
    //   page,
    //   limit,
    //   [userInclude]
    // );

    return await this.commentRepo.findPaginated(
      {
        parentCommentId: commentId,
        isHidden: false,
        ...(currentUser.role !== UserRoleEnum.ADMIN && {
          '$parentComment.isHidden$': false
        })
      },
      [['createdAt', 'DESC']],
      page,
      limit,
      [
        {
          model: User,
          as: 'user',
          required: currentUser.role !== UserRoleEnum.ADMIN,
          ...(currentUser.role !== UserRoleEnum.ADMIN && {
            where: {
              isDeleted: false,
              isBlocked: false
            }
          })
        },
        {
          model: Comment,
          as: 'parentComment',
          required: currentUser.role !== UserRoleEnum.ADMIN
        }
      ]
    );
  }

  async toggleLikeComment(user: User, commentId: string) {
    const isLiked = await this.commentLikesRepo.findOne({
      userId: user.id,
      commentId
    });
    if (isLiked) return await this.unlikeComment(user, commentId);
    return await this.likeComment(user, commentId);
  }
  async isUserAssignedToCourseOrError(
    courseId: string,
    user: User
  ): Promise<void> {
    const userAssignedCourse = await this.usersAssignmentsRepo.findOne({
      courseId,
      userId: user.id
    });

    if (!userAssignedCourse && user.role === UserRoleEnum.USER)
      throw new BaseHttpException(ErrorCodeEnum.COURSE_NOT_ASSIGNED_TO_USER);
  }
}
