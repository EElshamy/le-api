import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  PrimaryKey,
  Column,
  Table,
  Model,
  DataType,
  Default,
  CreatedAt,
  UpdatedAt,
  HasMany
} from 'sequelize-typescript';
import { Timestamp } from '../_common/graphql/timestamp.scalar';
import { paginate } from '../_common/paginator/paginator.service';
import { Lecturer } from '../lecturer/models/lecturer.model';
import { Includeable, FindAttributeOptions, GroupOption } from 'sequelize';

@Table
@ObjectType()
export class JobTitle extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Column
  @Field()
  arName: string;

  @Column
  @Field()
  enName: string;

  @Default(true)
  @Column
  @Field()
  isActive: boolean;

  @Column(DataType.VIRTUAL)
  @Field(() => Int, { defaultValue: 0 })
  timesUsed: number;

  @HasMany(() => Lecturer)
  lecturers: Lecturer[];

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Timestamp)
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Timestamp)
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
    return paginate<JobTitle>(
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
