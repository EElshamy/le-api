import { Field, Int, ObjectType } from '@nestjs/graphql';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { User } from '@src/user/models/user.model';
import { AbstractDataType } from 'sequelize';
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
import { UpdateActions } from '../enums/update-reasons.enum';

@Table
@ObjectType()
export class Logs extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number;

  @Column
  @Field()
  programId: string;

  @Column(getColumnEnum(LearningProgramTypeEnum))
  @Field(() => LearningProgramTypeEnum)
  programType: LearningProgramTypeEnum;

  @Column({ onDelete: 'set null', type: DataType.UUID })
  @ForeignKey(() => User)
  byId: string;

  @Field(() => User)
  @BelongsTo(() => User, 'byId')
  by: User;

  // @Column({
  //   type: DataType.ARRAY(DataType.ENUM(...Object.values(UpdateActions)))
  // })
  @Column({ type: DataType.ARRAY(DataType.STRING) })
  @Field(() => [UpdateActions], { nullable: true })
  updateActions: UpdateActions[];

  @CreatedAt
  @Field(() => Date)
  createdAt: Date;
}
