import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { Course } from './course.model';
import { User } from '../../user/models/user.model';
import { paginate } from '../../_common/paginator/paginator.service';

@ObjectType()
@Table
export class CancelCoursePurchase extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number;

  @ForeignKey(() => User)
  @Column({ onDelete: 'set null', type: DataType.UUID })
  @Field(() => String)
  userId: string;

  @BelongsTo(() => User)
  @Field(() => User)
  user: User;

  @ForeignKey(() => Course)
  @Column({ onDelete: 'set null', type: DataType.UUID })
  @Field(() => String)
  courseId: string;

  @BelongsTo(() => Course)
  @Field(() => Course)
  course: Course;

  @Column({ type: DataType.TEXT })
  @Field(() => String)
  reason: string;

  @CreatedAt
  @Field(() => Date)
  createdAt: Date;

  @UpdatedAt
  @Field(() => Date)
  updatedAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include?: Includeable[],
    attributes?: FindAttributeOptions,
    isNestAndRaw?: boolean,
    subQuery?: boolean,
    group?: GroupOption
  ) {
    return paginate<CancelCoursePurchase>(
      this,
      filter,
      sort,
      page,
      limit,
      include,
      attributes,
      isNestAndRaw,
      subQuery,
      group
    );
  }
}
