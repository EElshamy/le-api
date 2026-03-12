import { Field, ID, ObjectType } from '@nestjs/graphql';
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
import { Timestamp } from '../../_common/graphql/timestamp.scalar';
import { paginate } from '../../_common/paginator/paginator.service';
import { getColumnEnum } from '../../_common/utils/columnEnum';
import { ApprovalStatusEnum } from '../enums/lecturer.enum';
import { Lecturer } from './lecturer.model';

@Table({
  tableName: 'LecturerRequests',
  indexes: [
    { name: 'lecturer_requests_status_idx', fields: ['status'] },
    { name: 'lecturer_requests_lecturerId_idx', fields: ['lecturerId'] },
    { name: 'lecturer_requests_createdAt_idx', fields: ['createdAt'] },
    { name: 'lecturer_requests_status_createdAt_idx', fields: ['status', 'createdAt'] },
    { name: 'lecturer_requests_lecturerId_createdAt_idx', fields: ['lecturerId', 'createdAt'] }
  ]
})
@ObjectType()
export class LecturerRequest extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @AllowNull(false)
  @ForeignKey(() => Lecturer)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  lecturerId: string;

  @BelongsTo(() => Lecturer)
  lecturer: Lecturer;

  @Default(ApprovalStatusEnum.PENDING)
  @Column({ type: getColumnEnum(ApprovalStatusEnum) })
  @Field(() => ApprovalStatusEnum)
  status: ApprovalStatusEnum;

  @Column(DataType.DATE)
  @Field(() => Timestamp, { nullable: true })
  statusChangedAt: Date | number;

  @Field({ nullable: true })
  @Column(DataType.TEXT)
  rejectReason: string;

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
    return paginate<LecturerRequest>(this, filter, sort, page, limit, include);
  }
}
