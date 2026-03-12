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
import { User } from './user.model';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { paginate } from '@src/_common/paginator/paginator.service';
import { Course } from '@src/course/models/course.model';
  
  @Table({ timestamps: true, tableName: 'UserPasswordHistories' })
  export class UserPasswordHistory extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column({ type: DataType.UUID })
    id: string;
  
    @ForeignKey(() => User)
    @AllowNull(false)
    @Column({ type: DataType.UUID, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    userId: string;
  
    @BelongsTo(() => User)
    user: User;
  
    @AllowNull(false)
    @Column({ type: DataType.STRING })
    password: string;
  
    @AllowNull(false)
    @Default(DataType.NOW)
    @Column({ type: DataType.DATE })
    changedAt: Date;
  
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
    ): Promise<PaginationRes<Course>> {
      return paginate<Course>(
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