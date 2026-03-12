import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  AllowNull,
  BelongsTo,
  CreatedAt
} from 'sequelize-typescript';
import { Field, ID } from '@nestjs/graphql';
import { Lecturer } from './lecturer.model';
import { FieldOfTraining } from '../../field-of-training/field-of-training.model';

@Table({ timestamps: true })
export class LecturerFieldOfTraining extends Model {
  @AllowNull(false)
  @ForeignKey(() => Lecturer)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  lecturerId: string;

  @BelongsTo(() => Lecturer, 'lecturerId')
  lecturer: Lecturer;

  @ForeignKey(() => FieldOfTraining)
  @AllowNull(false)
  @Column({ type: DataType.UUID, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @Field(() => ID)
  fieldOfTrainingId: string;

  @BelongsTo(() => FieldOfTraining, 'fieldOfTrainingId')
  fieldOfTraining: FieldOfTraining;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;
}
