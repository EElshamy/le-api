import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { paginate } from '@src/_common/paginator/paginator.service';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { FaqForEnum } from '../enums/faq.enum';

@Table({
  paranoid: true,
  timestamps: true
})
@ObjectType()
export class Faq extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(type => ID)
  id: string;

  @Field()
  @Column
  code: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({ nullable: true })
  enQuestion: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({ nullable: true })
  arQuestion: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({ nullable: true })
  enAnswer: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({ nullable: true })
  arAnswer: string;

  @Column({ type: getColumnEnum(FaqForEnum), defaultValue: FaqForEnum.ALL })
  @Field(() => FaqForEnum)
  for: FaqForEnum;

  @AllowNull(false)
  @Default(true)
  @Column
  @Field()
  isPublished: boolean;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Timestamp, { nullable: true })
  updatedAt?: Date;

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Timestamp, { nullable: true })
  createdAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include: any = []
  ) {
    return paginate<Faq>(this, filter, sort, page, limit, include);
  }
}
