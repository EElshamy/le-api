import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Diploma } from '@src/diploma/models/diploma.model';
import { FindAttributeOptions, GroupOption, Includeable, Op } from 'sequelize';
import {
  AutoIncrement,
  BeforeCreate,
  BeforeUpdate,
  Column,
  CreatedAt,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt
} from 'sequelize-typescript';
import { Timestamp } from '../../_common/graphql/timestamp.scalar';
import { paginate } from '../../_common/paginator/paginator.service';
import { Course } from '../../course/models/course.model';
import { slugify } from 'transliteration';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';

@ObjectType()
@Table
export class Category extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number;

  @Column
  @Field()
  arName: string;

  @Unique('unique_category_names')
  @Column
  @Field()
  enName: string;

  @Default(0)
  @Column(DataType.VIRTUAL)
  @Field(() => Int, { defaultValue: 0 })
  timesUsed: number;

  @Default(true)
  @Column
  @Field()
  isActive: boolean;

  @HasMany(() => Course)
  courses: Course[];

  @HasMany(() => Diploma)
  diplomas: Diploma[];

  @Field(() => String, { nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  image?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Timestamp)
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Timestamp)
  updatedAt: Date;

  @Column({ type: DataType.STRING, defaultValue: null })
  @Field(() => String, { nullable: true })
  slug?: string;

  @BeforeCreate
  // @BeforeUpdate
  static async generateSlug(instance: Category) {
    if (instance.changed('enName') || !instance.slug) {
      let baseSlug = slugify(instance.enName, {
        lowercase: true,
      });
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (
        await Category.findOne({
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
  static async uniqueBlogTitle(instance: Category) {
    if ((instance.enName || instance.arName) && instance.isActive) {
      const existingBlog = await Category.findOne({
        where: {
          [Op.or]: [{ enName: instance.enName }, { arName: instance.arName }],
          id: { [Op.ne]: instance.id },
          isActive: true
        }
      });

      if (existingBlog) {
        throw new BaseHttpException(ErrorCodeEnum.CATEGORY_NAME_EXISTS);
      }
    }
  }

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
    return paginate<Category>(
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
