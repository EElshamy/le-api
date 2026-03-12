import { NestDataLoader } from '../../_common/types/loader.interface';
import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { Comment } from '../models/comment.model';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { User } from '../../user/models/user.model';

@Injectable()
export class CommentIsLikedLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.CommentsRepository)
    private readonly commentRepo: IRepository<Comment>
  ) {}

  generateDataLoader(currentUser: User): DataLoader<any, any> {
    return new DataLoader(async (commentIds: string[]) => {
      return this.findIsCommentLiked(commentIds, currentUser);
    });
  }

  async findIsCommentLiked(commentIds: string[], currentUser: User) {
    const comments = await this.commentRepo.findAll({ id: { [Op.in]: commentIds } }, ['likedBy']);

    const commentMap = comments.reduce((map, comment) => {
      const isLiked = comment.likedBy?.some(user => user.id === currentUser.id);
      map.set(comment.id, isLiked);
      return map;
    }, new Map<string, boolean>());

    return commentIds.map(id => commentMap.get(id) || false);
  }
}
