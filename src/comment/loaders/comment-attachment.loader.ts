import { NestDataLoader } from '../../_common/types/loader.interface';
import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { Comment } from '../models/comment.model';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { File } from '../../_common/uploader/file.model';

@Injectable()
export class AttachmentLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.FilesRepository)
    private readonly fileRepo: IRepository<File>
  ) {}

  generateDataLoader(): DataLoader<any, any> {
    return new DataLoader(async (commentsIds: string[]) => {
      return this.findCommentAttachmentByCommentIds(commentsIds);
    });
  }

  async findCommentAttachmentByCommentIds(commentsIds: string[]) {
    // const attachments = await this.fileRepo.findAll({ commentId: { [Op.in]: commentsIds } });

    // const attachmentMap = attachments.reduce((map, attachment) => {
    //   if (!map.has(attachment.commentId)) map.set(attachment.commentId, []);
    //   map.get(attachment.commentId).push(attachment);
    //   return map;
    // }, new Map<string, File[]>());

    // return commentsIds.map(id => attachmentMap.get(id) || []);

    return [];
  }
}
