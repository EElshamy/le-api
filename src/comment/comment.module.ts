import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import { CommentTransformer } from './transformers/comment.transformer';
import { FirstReplyCommentLoader } from './loaders/comment-reply.loader';
import { RepliesLoader } from './loaders/comment-replies.loader';
import { CommentLikesLoader } from './loaders/comment-likers.loader';
import { CommentIsLikedLoader } from './loaders/comment-is-liked.loader';
import { AttachmentLoader } from './loaders/comment-attachment.loader';

@Module({
  providers: [
    CommentResolver,
    CommentService,
    RepliesLoader,
    AttachmentLoader,
    CommentTransformer,
    CommentLikesLoader,
    CommentIsLikedLoader,
    FirstReplyCommentLoader
  ]
})
export class CommentModule {}
