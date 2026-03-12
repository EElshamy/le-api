import {
  Table,
  Model,
  Column,
  DataType,
  Default,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';
import { User } from '../../user/models/user.model';
// import { Report } from '../report/models/report.model';
// import { Attachment } from '../attachment/models/attachment.model';

import { Course } from '../../course/models/course.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CommentLikes } from './comment-like.model';
import { Timestamp } from '../../_common/graphql/timestamp.scalar';
import { paginate } from '../../_common/paginator/paginator.service';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';

@Table({
  timestamps: true,
  tableName: 'Comments'
})
@ObjectType()
export class Comment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  @Field(() => String)
  content: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  userId: string | null;

  @ForeignKey(() => Course)
  @Column({ type: DataType.UUID, allowNull: false })
  courseId: string;

  // @ForeignKey(() => Report)
  // @Column({ type: DataType.UUID, allowNull: true })
  // reportId: string;

  // @ForeignKey(() => Lesson)
  // @Column({ type: DataType.UUID, allowNull: true })
  // lessonId: string;

  @ForeignKey(() => Comment)
  @Column({ type: DataType.UUID, allowNull: true })
  @Field(() => String, { nullable: true })
  parentCommentId: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  hiddenById: string;

  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  // @Field(() => User, { nullable: true })
  user?: User;

  @BelongsTo(() => Course)
  course: Course;

  // @BelongsTo(() => Lesson)
  // lesson: Lesson;

  // @BelongsTo(() => Report)
  // report: Report;

  // @HasMany(() => File, { foreignKey: 'commentId', as: 'attachments' })
  // attachments: File[];

  @Field(() => String, { nullable: true })
  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  attachments?: string[];

  @BelongsTo(() => Comment, { as: 'parentComment' })
  parentComment: Comment;

  @HasMany(() => Comment, { foreignKey: 'parentCommentId', as: 'replies' })
  replies: Comment[];

  @BelongsToMany(() => User, () => CommentLikes)
  likedBy: User[];

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  @Field(() => Number, { nullable: true, defaultValue: 0 })
  numberOfReplies: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  @Field(() => Number, { nullable: true, defaultValue: 0 })
  numberOfLikes: number;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  @Field(() => Boolean)
  isHidden: boolean;

  @BelongsTo(() => User, { as: 'hiddenBy' })
  hiddenBy: User;

  @Field(() => Timestamp)
  @CreatedAt
  createdAt: Date;

  @Field(() => Timestamp, { nullable: true })
  @UpdatedAt
  updatedAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include?: Includeable[],
    attributes?: FindAttributeOptions,
    isNestAndRaw?: boolean,
    subQuery?: boolean,
    group?: GroupOption
  ) {
    return paginate<Course>(
      this,
      filter,
      sort,
      page,
      limit,
      include,
      attributes,
      isNestAndRaw,
      subQuery,
      group
    );
  }
}
