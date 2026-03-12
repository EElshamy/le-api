import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
  BeforeCreate,
  BeforeUpdate,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
  Unique
} from 'sequelize-typescript';
import { Timestamp } from '../../_common/graphql/timestamp.scalar';
import { paginate } from '../../_common/paginator/paginator.service';
import { Blog } from '../blog/models/blog.model';
import { BlogTag } from './blog-tag.model';
import { slugify } from 'transliteration';
import { Op } from 'sequelize';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';

@Table
@ObjectType()
export class Tag extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number;

  @AllowNull(false)
  @Column
  @Field()
  arName: string;

  @Unique('unique_tag_names')
  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  enName: string;

  @Default(0)
  @Column(DataType.VIRTUAL)
  @Field(() => Int, { defaultValue: 0 })
  timesUsed: number;

  @Default(true)
  @Column
  @Field()
  isActive: boolean;

  @BelongsToMany(() => Blog, () => BlogTag)
  blogTags: Blog[];

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
  static async generateSlug(instance: Tag) {
    if (instance.changed('enName') || !instance.slug) {
      let baseSlug = slugify(instance.enName, {
        lowercase: true
      });
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (
        await Tag.findOne({
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
  static async uniqueTagTitle(instance: Tag) {
    if ((instance.enName || instance.arName) && instance.isActive === true) {
      const existingTag = await Tag.findOne({
        where: {
          [Op.or]: [{ enName: instance.enName }, { arName: instance.arName }],
          id: { [Op.ne]: instance.id },
          isActive: true
        }
      });

      if (existingTag) {
        throw new BaseHttpException(ErrorCodeEnum.CATEGORY_NAME_EXISTS);
      }
    }
  }

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include: any = []
  ) {
    return paginate<Tag>(this, filter, sort, page, limit, include);
  }
}
