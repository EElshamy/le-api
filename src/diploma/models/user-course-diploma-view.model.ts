import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
  CreatedAt,
  Default,
  PrimaryKey
} from 'sequelize-typescript';
import { User } from '@src/user/models/user.model';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';

@ObjectType()
@Table({
  tableName: 'UserCourseDiplomaViews',
  timestamps: true,
  updatedAt: false
})
export class UserCourseDiplomaView extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  @Field(() => ID)
  id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId: string;

  @ForeignKey(() => Course)
  @Column(DataType.UUID)
  courseId: string;

  @ForeignKey(() => Diploma)
  @Column(DataType.UUID)
  diplomaId: string;

  @CreatedAt
  @Column(DataType.DATE)
  @Field(() => Timestamp)
  createdAt: Date;
}
