import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  Default
} from 'sequelize-typescript';
import { Course } from './course.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { on } from 'events';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { CommissionType } from '../enums/course.enum';
import { Col } from 'sequelize/types/utils';
import { getColumnEnum } from '@src/_common/utils/columnEnum';

@Table
@ObjectType()
export class CourseLecturer extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @ForeignKey(() => Course)
  @Column({ type: DataType.UUID, allowNull: false, onDelete: 'CASCADE' })
  @Field(() => ID)
  courseId: string;

  @ForeignKey(() => Lecturer)
  @Column({ type: DataType.UUID, allowNull: false, onDelete: 'CASCADE' })
  @Field(() => ID)
  lecturerId: string;

  @BelongsTo(() => Course)
  course: Course;

  @BelongsTo(() => Lecturer)
  lecturer: Lecturer;

  @Column({ type: DataType.FLOAT, allowNull: false })
  @Field(() => Number)
  commission: number;

  @Field(() => CommissionType)
  @Column(getColumnEnum(CommissionType))
  commissionType: CommissionType;

  @CreatedAt
  @Field(() => Timestamp)
  createdAt?: Date | number;

  @UpdatedAt
  @Field(() => Timestamp)
  updatedAt?: Date | number;
}
