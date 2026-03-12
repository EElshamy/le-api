import { Table, Model, ForeignKey, Column, DataType } from 'sequelize-typescript';
import { Comment } from './comment.model';
import { User } from '../../user/models/user.model';

@Table({
  timestamps: true,
  tableName: 'CommentLikes'
})
export class CommentLikes extends Model {
  @ForeignKey(() => Comment)
  @Column({ type: DataType.UUID, allowNull: false })
  commentId: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId: string;
}
