import { getColumnEnum } from '@src/_common/utils/columnEnum';
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
import { User } from '../user/models/user.model';
import { UserVerificationCodeUseCaseEnum } from '../user/user.enum';

@Table({ timestamps: true, tableName: 'UserVerificationCodes' })
export class UserVerificationCode extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @Default(UserVerificationCodeUseCaseEnum.PASSWORD_RESET)
  @AllowNull(false)
  @Column({ type: getColumnEnum(UserVerificationCodeUseCaseEnum) })
  useCase: UserVerificationCodeUseCaseEnum;

  @AllowNull(false)
  @Column
  code: string;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  expiryDate: Date;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ onDelete: 'CASCADE', onUpdate: 'CASCADE', type: DataType.UUID })
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  @Column
  createdAt: Date;

  @UpdatedAt
  @Column
  updatedAt: Date;
}
