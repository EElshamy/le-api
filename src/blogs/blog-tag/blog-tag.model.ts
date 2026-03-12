import { Field, ID } from '@nestjs/graphql';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table
} from 'sequelize-typescript';
import { Blog } from '../blog/models/blog.model';
import { Tag } from './tag.model';

@Table({ timestamps: false })
export class BlogTag extends Model {
  @ForeignKey(() => Tag)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @Field(() => ID)
  tagId: number;

  @BelongsTo(() => Tag, 'tagId')
  tag: Tag;

  @ForeignKey(() => Blog)
  @AllowNull(false)
  @Column({ type: DataType.UUID, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @Field(() => ID)
  blogId: string;

  @BelongsTo(() => Blog, 'blogId')
  Blog: Blog;

  @Column(DataType.INTEGER)
  order: number;
}
