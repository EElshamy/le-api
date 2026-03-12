import { Field, ID, ObjectType } from '@nestjs/graphql';
import { paginate } from '@src/_common/paginator/paginator.service';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { ReporterTypeEnum } from '@src/report/enums/reporter-type.enum';
import { User } from '@src/user/models/user.model';
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
  Table
} from 'sequelize-typescript';
import { ContactReasonEnum } from '../enums/contact-message.enum';

@Table({ timestamps: true })
@ObjectType()
export class ContactMessage extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(type => ID)
  id: string;

  @Column
  @Field()
  code: string;

  @Column
  @Field()
  fullname: string;

  @Column
  @Field()
  email: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  phone: string;

  @AllowNull(false)
  @Column({ type: getColumnEnum(ContactReasonEnum) })
  @Field(type => ContactReasonEnum)
  contactReason: ContactReasonEnum;

  @Column
  @Field()
  subject: string;

  @AllowNull(false)
  @Column({ type: DataType.TEXT })
  @Field()
  message: string;

  @Field(() => [String], { nullable: 'itemsAndList' })
  @Column({ type: DataType.ARRAY(DataType.STRING) })
  attachments: string[];

  @Column
  @Field(() => ReporterTypeEnum)
  senderType: ReporterTypeEnum;

  @ForeignKey(() => User)
  @Column({ onDelete: 'set null', type: DataType.UUID })
  userId: string;

  @BelongsTo(() => User)
  @Field(() => User, { nullable: true })
  user: User;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  resolvedAt?: Date;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include: any = []
  ) {
    return paginate<ContactMessage>(this, filter, sort, page, limit, include);
  }
}
