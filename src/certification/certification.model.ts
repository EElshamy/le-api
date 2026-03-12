import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { paginate } from '@src/_common/paginator/paginator.service';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { UpperCaseLearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { User } from '@src/user/models/user.model';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';
import {
  BeforeCreate,
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
import { CertificationType } from './certifications.type';

@ObjectType()
@Table
export class Certification extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  //@ForeignKey(() => Course)
  @Field(() => String, { nullable: true })
  @Column({ onDelete: 'set null', type: DataType.UUID })
  learningProgramId: string;

  @Field(() => UpperCaseLearningProgramTypeEnum, { nullable: true })
  @Column({
    onDelete: 'set null',
    type: getColumnEnum(UpperCaseLearningProgramTypeEnum)
  })
  learningProgramType: UpperCaseLearningProgramTypeEnum;

  // @BelongsTo(() => Course)
  // @Field(() => Course, { nullable: true })
  // course: Course;

  @ForeignKey(() => User)
  @Column({ onDelete: 'set null', type: DataType.UUID })
  userId: string;

  @BelongsTo(() => User)
  @Field(() => User)
  user: User;

  @Field()
  @CreatedAt
  createdAt: Date;

  @Field()
  @Column({ type: DataType.TEXT })
  serialNumber: string;

  @Field(() => String, { nullable: true })
  downloadArUrl?: string;

  @Field(() => String, { nullable: true })
  downloadEnUrl?: string;

  @Field(() => String, { nullable: true })
  previewEnUrl?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  pending?: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ type: DataType.DATE, allowNull: true })
  expectedCertificationDate?: Date;

  @Field(() => String, { nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  enUserName?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  arUserName?: string;

  @Field(() => CertificationType, { defaultValue: CertificationType.LEIAQA })
  @Column({
    type: getColumnEnum(CertificationType),
    defaultValue: CertificationType.LEIAQA
  })
  certificationType: CertificationType;

  // @BeforeCreate
  // static async generateSerialNumber(instance: Certification) {
  //   if (!instance.serialNumber && instance.id && instance.userId) {
  //     instance.serialNumber =
  //       instance.learningProgramId.slice(-10) + instance.userId.slice(-10);
  //   }
  // }

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
  ): Promise<PaginationRes<Certification>> {
    return paginate<Certification>(
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
