import { ObjectType } from '@nestjs/graphql';
import { User } from '@src/user/models/user.model';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table
} from 'sequelize-typescript';
import { Notification } from './notification.model';

@Table({
  timestamps: true,
  tableName: 'NotificationUserStatuses',
  indexes: [
    {
      fields: [
        { name: 'receiverId' },
        { name: 'notificationId' },
        { name: 'seenAt' }
      ]
    }
  ]
})
@ObjectType()
export class NotificationUserStatus extends Model {
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ type: DataType.UUID, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  receiverId: string;

  @BelongsTo(() => User)
  receiver: User;

  @ForeignKey(() => Notification)
  @AllowNull(false)
  @Column({ type: DataType.UUID, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  notificationId: string;

  @BelongsTo(() => Notification)
  notification: Notification;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  seenAt?: Date;
}
