import { Field, Int, ObjectType } from '@nestjs/graphql';
import { DiplomaTools } from '@src/diploma/models/diploma-tools.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';
import {
  AutoIncrement,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { Timestamp } from '../../../_common/graphql/timestamp.scalar';
import { paginate } from '../../../_common/paginator/paginator.service';
import { Course } from '../../../course/models/course.model';
import { CourseTool } from './course-tool.mode';

@ObjectType()
@Table
export class Tool extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number;

  @Column
  @Field()
  name: string;

  @Column
  @Field({ nullable: true })
  image: string;

  @Default(0)
  @Column(DataType.VIRTUAL)
  @Field(() => Int, { defaultValue: 0 })
  timesUsed: number;

  @Default(true)
  @Column
  @Field()
  isActive: boolean;

  @BelongsToMany(() => Course, () => CourseTool)
  courseTool: Course[];

  @BelongsToMany(() => Diploma, () => DiplomaTools)
  diplomaTool: Course[];

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
    return paginate<Tool>(
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
