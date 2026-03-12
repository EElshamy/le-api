import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import {
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { PolicyEnum } from '../enums/policy.enum';

@Table({ timestamps: true })
@ObjectType()
export class Policy extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Column({ type: getColumnEnum(PolicyEnum), allowNull: false })
  @Field()
  title: PolicyEnum;

  @Column({ type: DataType.TEXT, allowNull: false })
  @Field()
  contentEn: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  @Field()
  contentAr: string;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Timestamp, { nullable: true })
  updatedAt?: Date;

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Timestamp, { nullable: true })
  createdAt: Date;
}
