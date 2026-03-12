import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '@src/user/models/user.model';
import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { Blog } from './blog.model';

@Table
@ObjectType()
export class BlogLike extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Index
  @ForeignKey(() => Blog)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  @Field(() => ID, { nullable: true })
  blogId: string;

  @Field(() => Blog, { nullable: true })
  @BelongsTo(() => Blog, 'blogId')
  blog: Blog;

  @Index
  @ForeignKey(() => User)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  @Field(() => ID, { nullable: true })
  userId: string;

  @BelongsTo(() => User)
  @Field(() => User, { nullable: true })
  user: User;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  @Field()
  updatedAt: Date;
}
