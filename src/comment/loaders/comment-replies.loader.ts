import { NestDataLoader } from '../../_common/types/loader.interface';
import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { Comment } from '../models/comment.model';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { User } from '../../user/models/user.model';
import { CommentSortInput } from '../inputs/sort-comment.input';
import { UserRoleEnum } from '../../user/user.enum';

@Injectable()
export class RepliesLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.CommentsRepository)
    private readonly commentRepo: IRepository<Comment>
  ) {}

  generateDataLoader(currentUser: User): DataLoader<any, any> {
    return new DataLoader(async (parentCommentIds: string[]) => {
      return this.findCommentRepliesByCommentIds(parentCommentIds, currentUser);
    });
  }

  async findCommentRepliesByCommentIds(
    parentCommentIds: string[],
    currentUser: User
  ) {
    const { sortBy, sortType } = currentUser['commentsSortPreferences']
      ? (currentUser['commentsSortPreferences'] as CommentSortInput)
      : { sortBy: 'createdAt', sortType: 'DESC' };

    const comments = await this.commentRepo.findAll(
      { parentCommentId: { [Op.in]: parentCommentIds } },
      ['parentComment', 'user'],
      [[sortBy, sortType]]
    );

    const commentMap = comments.reduce((map, comment) => {
      if (!map.has(comment.parentCommentId))
        map.set(comment.parentCommentId, []);

      const canShowReply =
        currentUser.role === UserRoleEnum.ADMIN ||
        (!comment.isHidden &&
          !comment.user.isDeleted &&
          !comment.parentComment?.isHidden);

      if (canShowReply) map.get(comment.parentCommentId)!.push(comment);

      return map;
    }, new Map<string, Comment[]>());

    return parentCommentIds.map(id => commentMap.get(id) || []);
  }
}
