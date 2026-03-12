import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { UserRoleEnum } from '@src/user/user.enum';
import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
@Table
export class DeletedLecturerRequestsLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id: number;

  @Column({ type: DataType.UUID })
  lecturerRequestId: string;

  @Column({ type: DataType.UUID })
  lecturerId: string;

  @Column({ type: DataType.UUID })
  userId: string;

  @Column
  phoneNumber: string;

  @Column
  email: string;

  @Default(UserRoleEnum.USER)
  @AllowNull(false)
  @Column({ type: getColumnEnum(UserRoleEnum) })
  role: UserRoleEnum;

  @CreatedAt
  deletedAt: Date;
}
