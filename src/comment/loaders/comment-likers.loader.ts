import { NestDataLoader } from '../../_common/types/loader.interface';
import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { Comment } from '../models/comment.model';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { User } from '../../user/models/user.model';

@Injectable()
export class CommentLikesLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.CommentsRepository)
    private readonly commentRepo: IRepository<Comment>
  ) {}

  generateDataLoader(): DataLoader<any, any> {
    return new DataLoader(async (commentIds: string[]) => {
      return this.findUsersWhoLikedComments(commentIds);
    });
  }

  async findUsersWhoLikedComments(commentIds: string[]) {
    const comments = await this.commentRepo.findAll({ id: { [Op.in]: commentIds } }, ['likedBy']);

    const commentMap = comments.reduce((map, comment) => {
      map.set(comment.id, comment.likedBy || []);
      return map;
    }, new Map<string, User[]>());

    return commentIds.map(id => commentMap.get(id) || []);
  }
}
