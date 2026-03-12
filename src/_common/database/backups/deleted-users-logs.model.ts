import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { PreferredPaymentMethodEnum } from '@src/lecturer/enums/lecturer.enum';
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
export class DeletedUsersLogs extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id: number;

  @Column({ type: DataType.UUID })
  userId: string;

  @Column({ type: DataType.STRING })
  code: string;

  @Column({ type: DataType.STRING })
  email: string;

  @Column({ type: DataType.STRING })
  name: string;

  @Default(UserRoleEnum.USER)
  @Column({
    type: getColumnEnum(UserRoleEnum)
  })
  role: UserRoleEnum;

  @CreatedAt
  @Column({ type: DataType.DATE })
  deletedAt: Date;

  @AllowNull(true)
  @Column(getColumnEnum(PreferredPaymentMethodEnum))
  preferredPaymentMethod: PreferredPaymentMethodEnum;

  @AllowNull(true)
  @Column
  bankIBAN: string;

  @AllowNull(true)
  @Column
  bankAccountNumber: string;

  @AllowNull(true)
  @Column
  vodafoneCashNumber: string;

  actionLogs: any;
  transactions: any;
}
