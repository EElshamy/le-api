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
  BelongsToMany
} from 'sequelize-typescript';
import { Timestamp } from '../_common/graphql/timestamp.scalar';
import { paginate } from '../_common/paginator/paginator.service';
import { LecturerFieldOfTraining } from '../lecturer/models/lecturer-field-of-training.model';
import { Lecturer } from '../lecturer/models/lecturer.model';
import { Includeable, FindAttributeOptions, GroupOption } from 'sequelize';
import { JobTitle } from '../job-title/job-title.model';

@Table
@ObjectType()
export class FieldOfTraining extends Model {
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

  @BelongsToMany(() => Lecturer, () => LecturerFieldOfTraining)
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
