import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '@src/user/models/user.model';
import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
import { UserAnswer } from './user-answer.model';
import { Lesson } from '@src/course/models/lesson.model';

@ObjectType()
@Table
export class UserQuizAttempt extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Field(() => String)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID })
  userId: string;

  @Field(() => User)
  @BelongsTo(() => User, { foreignKey: 'userId', onDelete: 'CASCADE' })
  user: User;

  @Field(() => Number)
  @ForeignKey(() => Lesson)
  @Column({ type: DataType.INTEGER })
  lessonId: number;

  @Field(() => Lesson)
  @BelongsTo(() => Lesson, { foreignKey: 'lessonId', onDelete: 'CASCADE' })
  lesson: Lesson;

  @Field(() => Number)
  @Column({ type: DataType.FLOAT })
  score: number;

  @Field(() => Boolean)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isPassed: boolean;

  @Field(() => Number, { nullable: true, defaultValue: 0 })
  @Column({ type: DataType.INTEGER })
  numberOfCorrectAnswers: number;

  @Field(() => Number, { nullable: true, defaultValue: 0 })
  @Column({ type: DataType.INTEGER })
  numberOfWrongAnswers: number;

  @Field(() => [UserAnswer], { nullable: true })
  @HasMany(() => UserAnswer, { foreignKey: 'attemptId', onDelete: 'CASCADE' })
  userAnswers: UserAnswer[];

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Date, { nullable: true })
  createdAt: Date;
}
