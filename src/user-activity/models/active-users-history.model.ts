import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table
} from 'sequelize-typescript';
import { User } from '../../user/models/user.model';

@Table({ timestamps: false, indexes: [{ unique: true, fields: ['userId', 'activeAt'] }] })
export class ActiveUsersHistory extends Model {
  @ForeignKey(() => User)
  @AllowNull(true)
  @Column({ type: DataType.UUID, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @Column({ type: DataType.DATE })
  activeAt: Date | number;
}
