import { Field, Int, ObjectType, Float } from '@nestjs/graphql';
import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
import { Timestamp } from '../../_common/graphql/timestamp.scalar';
import { Course } from './course.model';

@ObjectType()
@Table
export class CourseDetail extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number;

  @ForeignKey(() => Course)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  courseId: string;

  @BelongsTo(() => Course, { foreignKey: 'courseId', onDelete: 'CASCADE' })
  @Field(() => Course, { nullable: true })
  course?: Course;

  @Field({ nullable: true })
  @Column({ type: DataType.STRING })
  promoVideo: string;

  @Field({ nullable: true })
  @Column({ type: DataType.STRING })
  enSummary: string;

  @Field({ nullable: true })
  @Column({ type: DataType.STRING })
  arSummary: string;

  @Field({ nullable: true })
  @Column({ type: DataType.TEXT })
  arAbout: string;

  @Field({ nullable: true })
  @Column({ type: DataType.TEXT })
  enAbout: string;

  @Field(() => [String], { nullable: 'itemsAndList' })
  @Column({ type: DataType.ARRAY(DataType.STRING) })
  outcomes: string[];

  @Field({ nullable: true })
  @Column({ type: DataType.STRING })
  rejectReason: string;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  enrolledUsersCount: number;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  videosCount: number;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  articlesCount: number;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  liveSessionsCount: number;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  quizzesCount: number;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  lessonsCount: number;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  sectionsCount: number;

  @Field(() => Timestamp, { nullable: true })
  @Column(DataType.DATE)
  requestSubmittedAt: number | Date;

  @Field(() => Timestamp, { nullable: true })
  @Column(DataType.DATE)
  approvedAt: number | Date;

  // ACE fields
  @Field({ nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  aceApprovedCourseNumber: string;

  @Field({ nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  acePresentName: string;

  @Field(() => Float, { nullable: true })
  @Column({ type: DataType.FLOAT, allowNull: true })
  aceCecsAwarded: number;

  @Field(() => Int, { nullable: true })
  @Column({ type: DataType.INTEGER, allowNull: true })
  aceDaysToGetCertified: number;

  @Field({ nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  aceSlug?: string;
}
