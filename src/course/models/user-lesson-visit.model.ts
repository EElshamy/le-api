import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
  BelongsTo,
  CreatedAt,
  Index,
  PrimaryKey,
  Default
} from 'sequelize-typescript';
import { User } from '@src/user/models/user.model';
import { Course } from '@src/course/models/course.model';
import { Lesson } from '@src/course/models/lesson.model';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';

@Table({
  tableName: 'UserLessonVisits',
  timestamps: true,
  updatedAt: false
})
@ObjectType()
export class UserLessonVisit extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @ForeignKey(() => User)
  @Index
  @Column({ type: DataType.UUID, allowNull: false, onDelete: 'CASCADE' })
  @Field(() => ID)
  userId: string;

  @BelongsTo(() => User)
  @Field(() => User)
  user: User;

  @ForeignKey(() => Course)
  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
    onDelete: 'CASCADE'
  })
  @Field(() => ID)
  courseId: string;

  @BelongsTo(() => Course)
  @Field(() => Course)
  course: Course;

  @ForeignKey(() => Lesson)
  @Index
  @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
  @Field(() => Int)
  lessonId: number;

  @BelongsTo(() => Lesson)
  @Field(() => Lesson)
  lesson: Lesson;

  @CreatedAt
  @Field(() => Timestamp)
  @Column({ type: DataType.DATE })
  createdAt: Date;
}
