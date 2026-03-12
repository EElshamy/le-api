import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Includeable } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';

import { DeviceEnum } from '../user/user.enum';
import { paginate } from '../_common/paginator/paginator.service';
import { ActionTypeEnum } from './user-sessions.enum';
import { User } from '../user/models/user.model';

@Table
@ObjectType()
export class UserSession extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ type: DataType.UUID, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @Field(() => ID)
  userId: string;

  @BelongsTo(() => User, 'userId')
  user: User;

  @Field({ nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  deviceName: string;

  @Field({ nullable: true })
  @Column({ allowNull: true })
  ipAddress: string;

  @Field({ nullable: true })
  @Column({ allowNull: true })
  actionType: ActionTypeEnum;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  country?: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  city?: string;

  @Column(DataType.STRING)
  @Field(() => DeviceEnum)
  device: DeviceEnum;

  @Column(DataType.TEXT)
  @Field({ nullable: true })
  fcmToken: string;

  @Default(true)
  @Column
  @Field()
  isActive: boolean;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include: Includeable[] = []
  ) {
    return paginate<UserSession>(this, filter, sort, page, limit, include);
  }
}
