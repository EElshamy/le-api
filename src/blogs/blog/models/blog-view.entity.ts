import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '@src/user/models/user.model';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { Blog } from './blog.model';

@Table
@ObjectType()
export class BlogView extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @ForeignKey(() => Blog)
  @AllowNull(false)
  @Column({ type: DataType.UUID, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @Field(() => ID, { nullable: true })
  blogId: string;

  @BelongsTo(() => Blog, 'blogId')
  blog: Blog;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @Field(() => ID, { nullable: true })
  userId: string;

  @BelongsTo(() => User, 'userId')
  user: User;

  @AllowNull(true)
  @Column
  ipAddress: string; // Store IP for guests

  @AllowNull(true)
  @Column
  userAgent: string; // Store device/browser info

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  @Field()
  updatedAt: Date;
}
