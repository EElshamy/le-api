import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
import { UserQuizAttempt } from './user-quiz-attempts.model';
import { QuizQuestion } from './quiz-question.model';
import { QuizAnswer } from './quiz-answer.model';
import { UserAnswerQuizAnswer } from './user-answer-quiz-answer.model';
@ObjectType()
@Table
export class UserAnswer extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Field(() => String)
  @ForeignKey(() => UserQuizAttempt)
  @Column({ type: DataType.UUID })
  attemptId: string;

  @Field(() => UserQuizAttempt)
  @BelongsTo(() => UserQuizAttempt)
  attempt: UserQuizAttempt;

  @Field(() => String)
  @ForeignKey(() => QuizQuestion)
  @Column({ type: DataType.UUID })
  questionId: string;

  @Field(() => QuizQuestion)
  @BelongsTo(() => QuizQuestion, {
    foreignKey: 'questionId',
    onDelete: 'CASCADE'
  })
  question: QuizQuestion;

  @Field(() => [QuizAnswer], { nullable: true })
  @BelongsToMany(() => QuizAnswer, () => UserAnswerQuizAnswer)
  answers: QuizAnswer[];

  @Field(() => Boolean)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isCorrect: boolean;

  @CreatedAt
  @Field(() => Date)
  @Column({ type: DataType.DATE })
  createdAt: Date;
}
