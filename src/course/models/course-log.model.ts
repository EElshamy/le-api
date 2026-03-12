import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { UserRoleEnum } from '@src/user/user.enum';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
import { Course } from './course.model';

@ObjectType()
@Table
export class ChangeLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number;

  @ForeignKey(() => Course)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  courseId: string;

  @BelongsTo(() => Course)
  course: Course;

  @Column
  @Field(() => UserRoleEnum)
  changedBy: UserRoleEnum;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  changeReason?: string;

  @CreatedAt
  @Field(() => Timestamp)
  createdAt?: Date | number;
}
