import { ObjectType, Field, Int } from '@nestjs/graphql';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { Column, CreatedAt, DataType, PrimaryKey, UpdatedAt,Model, Table } from 'sequelize-typescript';
import { DashboardEmailTypeEnum } from '../types/dashboard-email.type';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';
import { paginate } from '../../_common/paginator/paginator.service';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { de } from '@faker-js/faker';

@Table({
  timestamps: true
})
@ObjectType()
export class DashboardEmail extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  @Field(() => String)
  id: string;

  @Column({ type: getColumnEnum(DashboardEmailTypeEnum) , allowNull: false , defaultValue: DashboardEmailTypeEnum.ALL })
  @Field(type => DashboardEmailTypeEnum)
  target: DashboardEmailTypeEnum;

  @Column({ type: DataType.STRING, allowNull: false })
  @Field(() => String)
  title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  @Field(() => String)
  description: string;

  @Column({ type: DataType.STRING, allowNull: false })
  @Field(() => String)
  code: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  @Field(() => Int, { nullable: true }) 
  timesSent: number;

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Date , { nullable: true })
  createdAt: Date;

  @Column({ type: DataType.DATE })
  @Field(() => Date , { nullable: true })
  lastSentAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Date , { nullable: true })
  updatedAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 1,
    limit = 15,
    include?: Includeable[],
    attributes?: FindAttributeOptions,
    isNestAndRaw?: boolean,
    subQuery?: boolean,
    group?: GroupOption
  ): Promise<PaginationRes<DashboardEmail>> {
    return paginate<DashboardEmail>(
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
