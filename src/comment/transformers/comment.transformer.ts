import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { Course } from '../../course/models/course.model';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { CreateCommentInput } from '../inputs/create-comment.input';
import { Comment } from '../models/comment.model';
import { User } from '../../user/models/user.model';
import { File } from '../../_common/uploader/file.model';

@Injectable()
export class CommentTransformer {
  constructor(
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.CommentsRepository)
    private readonly commentRepo: IRepository<Comment>,
    @Inject(Repositories.FilesRepository) private readonly fileRepo: IRepository<File>
  ) {}

  async createComment(input: CreateCommentInput, user: User): Promise<Partial<Comment>> {
    const { courseId, parentCommentId, content, attachments } = input;

    // let files: File[] = [];
    // if (attachments) {
    //   files = await this.fileRepo.findAll({ id: { $in: attachments } });
    //   if (files.length !== attachments.length)
    //     throw new BaseHttpException(ErrorCodeEnum.FILE_DOESNT_EXIST);
    // }

    const course = await this.courseRepo.findOne({ id: courseId });
    if (!course) throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);

    const parentComment = parentCommentId
      ? await this.commentRepo.findOne({ id: parentCommentId })
      : null;

    if (parentComment) {
      const numberOfReplies = parentComment.numberOfReplies + 1;
      this.commentRepo.updateOne({ id: parentCommentId }, { numberOfReplies });
    }

    return {
      ...(parentComment && { parentCommentId }),
      courseId: course.id,
      userId: user.id,
      content,
      attachments
    };
  }
}
