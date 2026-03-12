import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
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
import { Diploma } from './diploma.model';

@ObjectType()
@Table
export class DiplomaDetail extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number;

  @ForeignKey(() => Diploma)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  diplomaId: string;

  @BelongsTo(() => Diploma)
  diploma: Diploma;

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

  @Field(() => Timestamp, { nullable: true })
  @Column(DataType.DATE)
  publishedAt: Date;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  enrolledUsersCount: number;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  coursesCount: number;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  lecturersCount: number;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  workshopsCount: number;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  totalRatings: number;
}
