import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Course } from '@src/course/models/course.model';
import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { paginate } from '../../_common/paginator/paginator.service';
import { getColumnEnum } from '../../_common/utils/columnEnum';
import { FieldOfTraining } from '../../field-of-training/field-of-training.model';
import { JobTitle } from '../../job-title/job-title.model';
import { User } from '../../user/models/user.model';
import {
  ApprovalStatusEnum,
  LecturerTypeEnum,
  PreferredPaymentMethodEnum
} from '../enums/lecturer.enum';
import { LecturerFieldOfTraining } from './lecturer-field-of-training.model';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
@Table
@ObjectType()
export class Lecturer extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Index
  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  userId: string;

  @BelongsTo(() => User)
  @Field(() => User)
  user: User;

  @AllowNull(true)
  @ForeignKey(() => JobTitle)
  @Column({ onDelete: 'SET NULL', type: DataType.UUID })
  jobTitleId: string;

  @BelongsTo(() => JobTitle)
  jobTitle: JobTitle;

  @Field(() => Int)
  @Column(DataType.INTEGER)
  yearsOfExperience: number;

  @Field({ nullable: true })
  @Column(DataType.STRING)
  linkedInUrl: string;

  @Field({ nullable: true })
  @Column(DataType.STRING)
  instagramUrl: string;

  @Field({ nullable: true })
  @Column(DataType.STRING)
  facebookUrl: string;

  @Field({ nullable: true })
  @Column(DataType.STRING)
  cvUrl: string;

  @Field({ nullable: true })
  @Column(DataType.TEXT)
  enBio: string;

  @Field({ nullable: true })
  @Column(DataType.TEXT)
  arBio: string;

  @Default(ApprovalStatusEnum.PENDING)
  @Column({ type: getColumnEnum(ApprovalStatusEnum) })
  @Field(() => ApprovalStatusEnum)
  status: ApprovalStatusEnum;

  @Field({ nullable: true })
  @Column(DataType.TEXT)
  uploadedMaterialUrl: string;

  @Column(DataType.INTEGER)
  @Field(() => Int, { nullable: true })
  commissionPercentage: number;

  @Default(false)
  @Field()
  @Column
  hasCompletedProfile: boolean;

  @BelongsToMany(() => FieldOfTraining, () => LecturerFieldOfTraining)
  @Field(() => [FieldOfTraining])
  fieldOfTrainings: FieldOfTraining[];

  @Column(getColumnEnum(PreferredPaymentMethodEnum))
  @Field(() => PreferredPaymentMethodEnum, { nullable: true })
  preferredPaymentMethod: PreferredPaymentMethodEnum;

  @Field({ nullable: true })
  @Column
  bankName: string;

  @Field({ nullable: true })
  @Column
  bankIBAN: string;

  @Field({ nullable: true })
  @Column
  bankAccountNumber: string;

  @Field({ nullable: true })
  @Column
  vodafoneCashNumber: string;

  @Column(getColumnEnum(LecturerTypeEnum))
  @Field(() => LecturerTypeEnum, { nullable: true })
  lecturerType: LecturerTypeEnum;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt: Date;

  // @HasMany(() => Course)
  // courses: Course[];

  @HasMany(() => CourseLecturer)
  courseLecturers: CourseLecturer[];

  @Column({ type: DataType.DATE, allowNull: true })
  lastCourseCreatedAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include: any = []
  ) {
    return paginate<Lecturer>(this, filter, sort, page, limit, include);
  }
}
