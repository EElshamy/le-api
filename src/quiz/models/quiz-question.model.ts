import { Field, ID, ObjectType } from '@nestjs/graphql';
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
import { QuizAnswer } from './quiz-answer.model';
import { QuestionTypeEnum } from '../enum/quiz.enum';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { Lesson } from '@src/course/models/lesson.model';

@ObjectType()
@Table
export class QuizQuestion extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Field(() => String)
  @Column({ type: DataType.STRING })
  enQuestionTitle: string;

  @Field(() => String)
  @Column({ type: DataType.STRING })
  arQuestionTitle: string;

  @Field(() => Number, { nullable: true })
  @Column({ type: DataType.INTEGER })
  order: number;

  // @Field(() => QuestionTypeEnum)
  // @Column({ type: getColumnEnum(QuestionTypeEnum) })
  // questionType: QuestionTypeEnum;

  @Field(() => Boolean)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isMultipleAnswers: boolean;

  @Field(() => Number)
  @ForeignKey(() => Lesson)
  @Column({ type: DataType.INTEGER })
  lessonId: number;

  @Field(() => Lesson)
  @BelongsTo(() => Lesson, { foreignKey: 'lessonId', onDelete: 'CASCADE' })
  lesson: Lesson;

  @Field(() => [QuizAnswer], { nullable: true })
  @HasMany(() => QuizAnswer, { foreignKey: 'questionId', onDelete: 'CASCADE' })
  answers: QuizAnswer[];

  @Default(0)
  @Column({ type: DataType.INTEGER })
  @Field(() => Number, { nullable: true, defaultValue: 0 })
  numberOfAnswers: number;

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Date, { nullable: true })
  createdAt: Date;
}
