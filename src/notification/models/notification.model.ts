import { Field, ID, ObjectType } from '@nestjs/graphql';
import { paginate } from '@src/_common/paginator/paginator.service';
import { User } from '@src/user/models/user.model';
import {
  AllowNull,
  BelongsToMany,
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
import {
  NotificationParentTypeEnum,
  NotificationTypeEnum
} from '../notification.enum';
import { NotificationUserStatus } from './notification-user-status.model';
import { getColumnEnum } from '@src/_common/utils/columnEnum';

@Table({
  timestamps: true,
  tableName: 'Notifications',
  indexes: [
    { fields: [{ name: 'senderId' }, { name: 'targetId' }, { name: 'type' }] }
  ]
})
@ObjectType()
export class Notification extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @BelongsToMany(() => User, () => NotificationUserStatus)
  receivers: Array<User & { NotificationUserStatus: NotificationUserStatus }>;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, onDelete: 'SET NULL', onUpdate: 'SET NULL' })
  senderId?: string;

  @AllowNull(true)
  @Field(() => String, { nullable: true })
  @Column({ type: DataType.UUID })
  targetId?: string;

  @AllowNull(true)
  @Field(() => NotificationParentTypeEnum, { nullable: true })
  @Column({
    type: getColumnEnum(NotificationParentTypeEnum),
    defaultValue: null
  })
  targetModel: NotificationParentTypeEnum;

  @AllowNull(false)
  @Column
  @Field(() => NotificationTypeEnum)
  type: NotificationTypeEnum;

  @AllowNull(true)
  @Column(DataType.TEXT)
  @Field({ nullable: true })
  thumbnail?: string;

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
  @Column(DataType.TEXT)
  log?: string;

  @Default(true)
  @AllowNull(false)
  @Column
  returnItToClient: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  @Field(() => String, { nullable: true })
  url?: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  @Field(() => Boolean, { nullable: true })
  seen?: boolean;

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
    include: any = []
  ) {
    return paginate<Notification>(this, filter, sort, page, limit, include);
  }
}
