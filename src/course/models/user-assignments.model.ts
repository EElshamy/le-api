import { Field, ID, Int } from '@nestjs/graphql';
import { paginate } from '@src/_common/paginator/paginator.service';
import { User } from '@src/user/models/user.model';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { Course } from './course.model';

@Table({
  tableName: 'UsersAssignments',
  indexes: [
    { name: 'idx_users_assignment_createdAt', fields: ['createdAt'] },
    { name: 'idx_users_assignment_userId', fields: ['userId'] },
    { name: 'idx_users_assignment_courseId', fields: ['courseId'] },
    { name: 'idx_users_assignment_diplomaId', fields: ['diplomaId'] },
    {
      name: 'idx_users_assignment_createdAt_userId',
      fields: ['createdAt', 'userId']
    }
  ]
})
export class UsersAssignment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @ForeignKey(() => Course)
  @AllowNull(true)
  @Column
  courseId: string;

  @AllowNull(true)
  @Column
  diplomaId: string;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column
  userId: string;

  @BelongsTo(() => Course)
  course: Course;

  @BelongsTo(() => User)
  user: User;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  @Field(() => Boolean)
  completed: boolean;

  @Default(0)
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  completedLessons: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  @Field(() => Boolean, { defaultValue: false, nullable: true })
  isAssignedByAdmin: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  @Field(() => Date, { nullable: true })
  accessExpiresAt?: Date;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
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
    return paginate<UsersAssignment>(
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
