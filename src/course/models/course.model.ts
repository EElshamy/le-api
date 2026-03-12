import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { env } from '@src/_common/utils/env';
import { DiplomaCourses } from '@src/diploma/models/diploma-course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { ILearningProgram } from '@src/learning-program/interfaces/learning-program.interface';
import { User } from '@src/user/models/user.model';
import { FindAttributeOptions, GroupOption, Includeable, Op } from 'sequelize';
import {
  AllowNull,
  BeforeCreate,
  BeforeDestroy,
  BeforeSave,
  BeforeUpdate,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt
} from 'sequelize-typescript';
import Stripe from 'stripe';
import { Timestamp } from '../../_common/graphql/timestamp.scalar';
import { paginate } from '../../_common/paginator/paginator.service';
import { getColumnEnum } from '../../_common/utils/columnEnum';
import { Comment } from '../../comment/models/comment.model';
import { Category } from '../../course-specs/category/category.model';
import { CourseSkill } from '../../course-specs/skill/models/course-skill.model';
import { Skill } from '../../course-specs/skill/models/skill.model';
import { CourseTool } from '../../course-specs/tool/models/course-tool.mode';
import { Tool } from '../../course-specs/tool/models/tool.model';
import { Lecturer } from '../../lecturer/models/lecturer.model';
import { LangEnum } from '../../user/user.enum';
import {
  ContentLevelEnum,
  CourseStatusEnum,
  CourseTimeUnit,
  CourseTypeEnum,
  PublicationStatusEnum,
  SyllabusCreationMethodEnum
} from '../enums/course.enum';
import { CourseDetail } from './course-detail.model';
import { Section } from './section.model';
import { UsersAssignment } from './user-assignments.model';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { CourseLecturer } from './course-lecturers.model';
import { slugify } from 'transliteration';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';

@Table({
  indexes: [
    { name: 'idx_course_status', fields: ['status'] },
    { name: 'idx_course_categoryId', fields: ['categoryId'] }
  ]
})
@ObjectType()
export class Course extends Model implements ILearningProgram {
  @PrimaryKey
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Column({ type: DataType.STRING })
  @Field({ nullable: true })
  code: string;

  @Column({ type: DataType.STRING })
  remoteProductId: string;

  // @ForeignKey(() => Lecturer)
  // @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  // @Field(() => ID, { nullable: true })
  // lecturerId: string;

  // @BelongsTo(() => Lecturer)
  // @Field(() => Lecturer, { nullable: true })
  // lecturer: Lecturer;

  // @Column(DataType.INTEGER)
  // @Field(() => Int, { nullable: true })
  // commissionPercentage: number;

  @HasMany(() => CourseLecturer)
  courseLecturers: CourseLecturer[];

  @HasOne(() => CourseDetail, { foreignKey: 'courseId' })
  @Field(() => CourseDetail, { nullable: true })
  courseDetail?: CourseDetail;

  @ForeignKey(() => Category)
  @Column({ onDelete: 'CASCADE', type: DataType.INTEGER })
  categoryId: number;

  @BelongsTo(() => Category)
  category: Category;

  @Column
  @Field({ nullable: true })
  arTitle: string;

  // @Unique('unique_course_titles')
  @Column
  @Field({ nullable: true })
  enTitle: string;

  @Column
  @Field()
  isCreatedByAdmin: boolean;

  @Column(getColumnEnum(LangEnum))
  @Field(() => LangEnum, { nullable: true })
  language: LangEnum;

  @Default(PublicationStatusEnum.PUBLIC)
  @Column(getColumnEnum(PublicationStatusEnum))
  @Field(() => PublicationStatusEnum)
  publicationStatus: PublicationStatusEnum;

  @Default(CourseStatusEnum.DRAFTED)
  @Column(getColumnEnum(CourseStatusEnum))
  @Field(() => CourseStatusEnum)
  status: CourseStatusEnum;

  @Column(getColumnEnum(SyllabusCreationMethodEnum))
  @Field(() => SyllabusCreationMethodEnum, { nullable: true })
  syllabusCreationMethod: SyllabusCreationMethodEnum;

  @Default(CourseTypeEnum.COURSE)
  @Column(getColumnEnum(CourseTypeEnum))
  @Field(() => CourseTypeEnum)
  type: CourseTypeEnum;

  @Column(getColumnEnum(ContentLevelEnum))
  @Field(() => ContentLevelEnum, { nullable: true })
  level: ContentLevelEnum;

  @Field({ nullable: true })
  @Column({ type: DataType.STRING })
  thumbnail: string;

  @Field(() => MoneyScalar, { nullable: true })
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  originalPrice: number;

  @Field(() => MoneyScalar, { nullable: true })
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  priceAfterDiscount: number;

  @Field({ nullable: true })
  @Column({ type: DataType.FLOAT })
  learningTime: number;

  @Column(getColumnEnum(CourseTimeUnit))
  @Field(() => CourseTimeUnit, { nullable: true })
  learningTimeUnit: CourseTimeUnit;

  @Default(0)
  @Field(() => Float)
  @Column({ type: DataType.FLOAT })
  averageRating: number;

  @Default(0)
  @Field(() => Int)
  @Column({ type: DataType.INTEGER })
  totalNumberOfRatings: number;

  @Default(0)
  @Field(() => Float)
  @Column({ type: DataType.FLOAT })
  totalRatings: number;

  @BelongsToMany(() => Tool, () => CourseTool)
  tools: Tool[];

  @BelongsToMany(() => Skill, () => CourseSkill)
  skills: Skill[];

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  collectionId?: string;

  @CreatedAt
  @Field(() => Timestamp)
  createdAt?: Date | number;

  @UpdatedAt
  @Field(() => Timestamp)
  updatedAt?: Date | number;

  @HasMany(() => Section, { onDelete: 'CASCADE' })
  @Field(() => [Section], { nullable: 'itemsAndList' })
  courseSections: Section[];

  @BelongsToMany(() => User, () => UsersAssignment)
  assignedUsers: User[];

  @HasMany(() => UsersAssignment)
  userAssignedCourses: UsersAssignment[];

  @HasMany(() => Comment, { foreignKey: 'courseId', as: 'comments' })
  comments: Comment[];

  @BelongsToMany(() => Diploma, () => DiplomaCourses)
  diplomas: Diploma[];

  @Field(() => Timestamp, { nullable: true })
  addedToDiplomaAt?: Date;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  @Field(() => Boolean, { nullable: true })
  enforceLessonsOrder: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  @Field(() => Boolean, { nullable: true })
  ACE_Certificate: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  @Field(() => Boolean, { nullable: true })
  LDISAUDI_Certificate: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  @Field(() => Boolean, { nullable: true })
  NASM_Certificate: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  @Field(() => Boolean, { nullable: true })
  isLiveCourse: boolean;

  @Column({ type: DataType.STRING, defaultValue: null })
  @Field(() => String, { nullable: true })
  slug?: string;

  @BeforeCreate
  // @BeforeUpdate
  static async generateSlug(instance: Course) {
    if (instance.changed('enTitle') || !instance.slug) {
      let baseSlug = slugify(instance.enTitle, {
        lowercase: true
      });
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (
        await Course.findOne({
          where: { slug: uniqueSlug, id: { [Op.ne]: instance.id } }
        })
      ) {
        uniqueSlug = `${baseSlug}-${counter++}`;
      }

      instance.slug = uniqueSlug;
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static async uniqueCourseTitle(instance: Course) {

    if (instance.status !== CourseStatusEnum.APPROVED) {
      return;
    }

    const orConditions = [];

    if (instance.enTitle) {
      orConditions.push({ enTitle: instance.enTitle });
    }

    if (instance.arTitle) {
      orConditions.push({ arTitle: instance.arTitle });
    }

    if (!orConditions.length) return;

    const existingCourse = await Course.findOne({
      where: {
        [Op.or]: orConditions,
        status: CourseStatusEnum.APPROVED,
        id: { [Op.ne]: instance.id }
      }
    });

    if (existingCourse) {
      throw new BaseHttpException(ErrorCodeEnum.COURSE_TITLE_EXISTS);
    }
  }

  // @BeforeSave
  // static handleWorkshopCertificate(instance: Course): void {
  //   if (instance.type === CourseTypeEnum.WORKSHOP) {
  //     instance.ACE_Certificate = true;
  //   }
  // }

  // static stripeClient: Stripe = new Stripe(env.STRIPE_SECRET_KEY);
  // @BeforeSave
  // static async stripeStateCreateHookHandler(instance: Course): Promise<void> {
  //   //1. if the product already exists in stripe we must archive the old one
  //   // because stripe dose not allow to delete a product for historical transactions reasons: https://docs.stripe.com/products-prices/manage-prices?dashboard-or-api=dashboard
  //   if (instance.remoteProductId) {
  //     await Course.stripeClient.products.update(instance.remoteProductId, {
  //       active: false
  //     });
  //   }

  //   instance.remoteProductId = (
  //     await Course.stripeClient.products.create({
  //       name: instance.code,
  //       metadata: {
  //         localId: instance.id
  //       },
  //       default_price_data: {
  //         unit_amount: instance?.priceAfterDiscount || 0,
  //         currency: env.PAYMENT_CURRENCY
  //       }
  //       // images: [instance?.thumbnail || 'default.jpg']
  //     })
  //   ).id;
  // }

  // @BeforeDestroy
  // static async stripeStateDeleteHookHandler(instance: Course): Promise<void> {
  //   if (instance.remoteProductId) {
  //     await Course.stripeClient.products.update(instance.remoteProductId, {
  //       active: false
  //     });
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
  ): Promise<PaginationRes<Course>> {
    return paginate<Course>(
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
