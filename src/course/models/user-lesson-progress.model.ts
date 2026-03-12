import { User } from '@src/user/models/user.model';
import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { Lesson } from './lesson.model';

@Table
export class UserLessonProgress extends Model {
  @Column
  @ForeignKey(() => User)
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @Column
  @ForeignKey(() => Lesson)
  lessonId: number;

  @BelongsTo(() => Lesson)
  lesson: Lesson;

  @Default(false)
  @Column
  completed: boolean; // Tracks if the lesson is completed

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt: Date;
}
