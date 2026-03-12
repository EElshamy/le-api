import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { env } from '@src/_common/utils/env';
import { UpperCaseLearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { Skill } from '@src/course-specs/skill/models/skill.model';
import { Tool } from '@src/course-specs/tool/models/tool.model';
import {
  ContentLevelEnum,
  CourseTimeUnit,
  PublicationStatusEnum
} from '@src/course/enums/course.enum';
import { Course } from '@src/course/models/course.model';
import { Max, MaxLength, Min, MinLength } from 'class-validator';
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
import { Category } from '../../course-specs/category/category.model';
import { LangEnum } from '../../user/user.enum';
import { DiplomaStatusEnum } from '../enums/diploma-status.enum';
import { DiplomaCourses } from './diploma-course.model';
import { DiplomaDetail } from './diploma-detail.model';
import { DiplomaSkills } from './diploma-skills.model';
import { DiplomaTools } from './diploma-tools.model';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { slugify } from 'transliteration';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { DiplomaTypeEnum } from '../enums/diploma-type.enum';

@Table
@ObjectType()
export class Diploma extends Model {
  @PrimaryKey
  @Field(() => ID)
  @Column({ type: DataType.UUID })
  id: string;

  @Default(DiplomaTypeEnum.PATH)
  @Column(getColumnEnum(DiplomaTypeEnum))
  @Field(() => DiplomaTypeEnum)
  diplomaType: DiplomaTypeEnum;

  @Field(() => PublicationStatusEnum)
  @Default(PublicationStatusEnum.PUBLIC)
  @Column(getColumnEnum(PublicationStatusEnum))
  publicationStatus: PublicationStatusEnum;

  @Default(DiplomaStatusEnum.DRAFTED)
  @Column(getColumnEnum(DiplomaStatusEnum))
  @Field(() => DiplomaStatusEnum)
  status: DiplomaStatusEnum;

  @Column({ type: DataType.STRING })
  @Field({ nullable: true })
  code: string;

  @Column
  @MinLength(2)
  @MaxLength(50)
  @Field({ nullable: true })
  arTitle: string;

  @Unique('unique_diploma_titles')
  @Column
  @MinLength(2)
  @MaxLength(70)
  @Field({ nullable: true })
  enTitle: string;

  @Column(getColumnEnum(LangEnum))
  @Field(() => LangEnum, { nullable: true })
  language: LangEnum;

  @BelongsToMany(() => Course, () => DiplomaCourses)
  courses: Course[];

  @ForeignKey(() => Category)
  @Column({ onDelete: 'CASCADE' })
  categoryId: number;

  @BelongsTo(() => Category, 'categoryId')
  category: Category;

  @Column(getColumnEnum(ContentLevelEnum))
  @Field(() => ContentLevelEnum, { nullable: true })
  level: ContentLevelEnum;

  @Field({ nullable: true })
  @Column({ type: DataType.STRING })
  thumbnail: string;

  @AllowNull(true)
  @Min(0)
  @Max(1000000000)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  @Field(() => MoneyScalar, { nullable: true })
  originalPrice: number;

  @Min(0)
  @Max(1000000000)
  @AllowNull(true)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  @Field(() => MoneyScalar, { nullable: true })
  priceAfterDiscount: number;

  @Field({ nullable: true })
  @Column({ type: DataType.FLOAT })
  learningTime: number;

  @Column(getColumnEnum(CourseTimeUnit))
  @Field(() => CourseTimeUnit, { nullable: true })
  learningTimeUnit: CourseTimeUnit;

  @BelongsToMany(() => Skill, () => DiplomaSkills)
  skills: Skill[];

  @BelongsToMany(() => Tool, () => DiplomaTools)
  tools: Tool[];

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

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  collectionId?: string;

  @Column({ type: DataType.STRING })
  remoteProductId: string;

  @HasOne(() => DiplomaDetail, 'diplomaId')
  @Field(() => DiplomaDetail, { nullable: true })
  diplomaDetail: DiplomaDetail;

  @Column(DataType.INTEGER)
  @Field(() => Int, { nullable: true })
  commissionPercentage: number;

  @Column({ type: DataType.STRING, defaultValue: null })
  @Field(() => String, { nullable: true })
  slug?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  @Field(() => Int, { nullable: true })
  accessDurationPerMonths?: number;

  @CreatedAt
  @Field(() => Timestamp)
  createdAt?: Date | number;

  @UpdatedAt
  @Field(() => Timestamp)
  updatedAt?: Date | number;

  // Temporary property to prevent infinite loop
  _isSaving: boolean = false;

  @BeforeCreate
  // @BeforeUpdate
  static async generateSlug(instance: Diploma) {
    if (instance.changed('enTitle') || !instance.slug) {
      let baseSlug = slugify(instance.enTitle, {
        lowercase: true
      });

      let uniqueSlug = baseSlug;
      let counter = 1;

      while (
        await Diploma.findOne({
          where: {
            slug: uniqueSlug,
            id: { [Op.ne]: instance.id }
          }
        })
      ) {
        uniqueSlug = `${baseSlug}-${counter++}`;
      }

      instance.slug = uniqueSlug;
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static async uniqueDiplomaTitle(instance: Diploma) {
    if (
      (instance.enTitle || instance.arTitle) &&
      instance.status === DiplomaStatusEnum.APPROVED
    ) {
      const existingDiploma = await Diploma.findOne({
        where: {
          [Op.or]: [
            { enTitle: instance.enTitle },
            { arTitle: instance.arTitle }
          ],
          id: { [Op.ne]: instance.id },
          status: DiplomaStatusEnum.APPROVED
        }
      });

      if (existingDiploma) {
        throw new BaseHttpException(ErrorCodeEnum.DIPLOMA_TITLE_EXISTS);
      }
    }
  }

  // static stripeClient: Stripe = new Stripe(env.STRIPE_SECRET_KEY);

  // @BeforeSave
  // static async stripeStateCreateHookHandler(instance: Diploma): Promise<void> {
  //   // Prevent infinite loop by checking if the instance is already being saved
  //   if (instance._isSaving) {
  //     return; // Skip the logic if the instance is being saved already
  //   }

  //   instance._isSaving = true; // Set the flag to indicate the instance is being saved

  //   // 1. If the product already exists in Stripe, archive the old one
  //   if (instance.remoteProductId) {
  //     await Diploma.stripeClient.products.update(instance.remoteProductId, {
  //       active: false
  //     });
  //   }

  //   instance.remoteProductId = (
  //     await Diploma.stripeClient.products.create({
  //       name: instance.code,
  //       metadata: {
  //         localId: instance.id
  //       },
  //       default_price_data: {
  //         unit_amount:
  //           (
  //             instance?.priceAfterDiscount >= 0 &&
  //             instance?.priceAfterDiscount !== null
  //           ) ?
  //             instance?.priceAfterDiscount
  //           : instance?.originalPrice,
  //         currency: env.PAYMENT_CURRENCY
  //       }
  //     })
  //   ).id;

  //   await instance.save(); // Save the instance only once

  //   instance._isSaving = false; // Reset the flag after the save
  // }

  // @BeforeDestroy
  // static async stripeStateDeleteHookHandler(instance: Diploma): Promise<void> {
  //   if (instance.remoteProductId) {
  //     await Diploma.stripeClient.products.update(instance.remoteProductId, {
  //       active: false
  //     });
  //   }
  // }

  // This field for all search result
  @Field({ defaultValue: 'DIPLOMA' })
  type: UpperCaseLearningProgramTypeEnum =
    UpperCaseLearningProgramTypeEnum.DIPLOMA;

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
  ): Promise<PaginationRes<Diploma>> {
    return paginate<Diploma>(
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
