import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
import { QuizQuestion } from './quiz-question.model';

@ObjectType()
@Table
export class QuizAnswer extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Field(() => String)
  @Column({ type: DataType.STRING })
  enAnswerTitle: string;

  @Field(() => String)
  @Column({ type: DataType.STRING })
  arAnswerTitle: string;

  @Field({ nullable: true })
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isCorrect: boolean;

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

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Date, { nullable: true })
  createdAt: Date;
}
