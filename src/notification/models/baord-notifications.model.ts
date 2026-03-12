import { Field, ID, ObjectType } from '@nestjs/graphql';
import { paginate } from '@src/_common/paginator/paginator.service';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { DeviceEnum } from '@src/user/user.enum';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';

@Table
@ObjectType()
export class BoardNotification extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  @Field()
  enTitle: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  @Field()
  arTitle: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  @Field()
  enBody: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  @Field()
  arBody: string;

  @AllowNull(true)
  @Field(() => DeviceEnum, { nullable: true })
  @Column({ type: getColumnEnum(DeviceEnum), defaultValue: null })
  device?: DeviceEnum;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  @Field(() => Number)
  timesSent: number;

  @CreatedAt
  @Field(() => Date)
  createdAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include: any = []
  ) {
    return paginate<Notification>(this, filter, sort, page, limit, include);
  }
}
