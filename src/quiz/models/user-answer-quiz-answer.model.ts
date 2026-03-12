import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table
} from 'sequelize-typescript';
import { QuizAnswer } from './quiz-answer.model';
import { UserAnswer } from './user-answer.model';
import { on } from 'events';

@Table
export class UserAnswerQuizAnswer extends Model {
  @ForeignKey(() => UserAnswer)
  @Column({ type: DataType.UUID })
  userAnswerId: string;

  @ForeignKey(() => QuizAnswer)
  @Column({ type: DataType.UUID })
  quizAnswerId: string;
}
