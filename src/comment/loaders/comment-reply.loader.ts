import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { QueryTypes } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { Sequelize } from 'sequelize-typescript';
import { NestDataLoader } from '../../_common/types/loader.interface';
import { Comment } from '../models/comment.model';

@Injectable()
export class FirstReplyCommentLoader implements NestDataLoader {
  constructor(
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize
  ) {}

  generateDataLoader(): DataLoader<any, any> {
    return new DataLoader(async (commentIds: string[]) =>
      this.findCommentFirstChildCommentByCommentIds(commentIds)
    );
  }

  async findCommentFirstChildCommentByCommentIds(commentIds: string[]) {
    const sql = `
    SELECT DISTINCT ON (c."parentCommentId") 
      c.*,                          
      to_jsonb(u.*) AS user     
    FROM "Comments" c
    LEFT JOIN "Users" u ON u.id = c."userId"
    WHERE c."parentCommentId" IN (:commentIds)
      AND c."parentCommentId" IS NOT NULL
    ORDER BY c."parentCommentId", c."createdAt" ASC
  `;
  
  const rows = await this.sequelize.query(sql, {
    replacements: { commentIds },
    type: QueryTypes.SELECT,
  });
  
  const commentMap = new Map<string, any>();
  
  for (const row of rows as any[]) {
    const { user, ...commentData } = row;
  
    const comment = {
      ...commentData,      
      user: user ?? null      
    };
  
    commentMap.set(comment.parentCommentId, comment);
  }
  
  return commentIds.map(id => commentMap.get(id) || null);
  
  
  }
}
