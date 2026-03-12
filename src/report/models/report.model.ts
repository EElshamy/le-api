import { Field, Int, ObjectType } from '@nestjs/graphql';
import { paginate } from '@src/_common/paginator/paginator.service';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { User } from '@src/user/models/user.model';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';
import {
  AutoIncrement,
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
import { ReportReasonEnum } from '../enums/report-reasons.enum';
import { ReportStatusEnum } from '../enums/report-status.enum';
import { ReportTargetEnum } from '../enums/report-targets.enum';
import { ReporterTypeEnum } from '../enums/reporter-type.enum';

@ObjectType()
@Table({
  tableName: 'ContentReports',
  indexes: [
    { name: 'content_reports_created_at_idx', fields: ['createdAt'] },
    { name: 'content_reports_status_idx', fields: ['status'] },
    { name: 'content_reports_target_type_id_idx', fields: ['targetType', 'targetId'] }
  ]
})
export class ContentReport extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number;

  @Column
  @Field()
  code: string;

  @Column(getColumnEnum(ReporterTypeEnum))
  @Field(() => ReporterTypeEnum)
  reporterType: ReporterTypeEnum;

  @Default(ReportStatusEnum.OPEN)
  @Column(getColumnEnum(ReportStatusEnum))
  @Field(() => ReportStatusEnum)
  status: ReportStatusEnum;

  @Column({ onDelete: 'set null', type: DataType.UUID })
  @Field(() => String)
  targetId: string;

  @Default(ReportTargetEnum.COURSE)
  @Column(getColumnEnum(ReportTargetEnum))
  @Field(() => ReportTargetEnum)
  targetType: ReportTargetEnum;

  @Default(ReportReasonEnum.FALSE_CLAIMS)
  @Column(getColumnEnum(ReportReasonEnum))
  @Field(() => ReportReasonEnum)
  reason: ReportReasonEnum;

  @ForeignKey(() => User)
  @Column({ onDelete: 'set null', type: DataType.UUID })
  userId: string;

  @BelongsTo(() => User)
  // @Field(() => User)
  user: User;

  // This for guest user
  @Column
  @Field()
  email: string;

  @Column
  @Field()
  fullname: string;

  @Column
  @Field()
  content: string;

  @CreatedAt
  @Field(() => Date)
  createdAt: Date;

  @UpdatedAt
  @Field(() => Date)
  updatedAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include?: Includeable[],
    attributes?: FindAttributeOptions,
    isNestAndRaw?: boolean,
    subQuery?: boolean,
    group?: GroupOption
  ) {
    return paginate<ContentReport>(
      this,
      filter,
      sort,
      page,
      limit,
      include,
      attributes,
      isNestAndRaw,
      subQuery,
      group
    );
  }
}
