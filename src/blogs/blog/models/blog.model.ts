import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import {
  manualPaginator,
  paginate
} from '@src/_common/paginator/paginator.service';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { BlogCategory } from '@src/blogs/blog-category/bLog-category.model';
import { BlogTag } from '@src/blogs/blog-tag/blog-tag.model';
import { Tag } from '@src/blogs/blog-tag/tag.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  BeforeCreate,
  BeforeUpdate,
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
  UpdatedAt,
  Unique
} from 'sequelize-typescript';
import { BlogStatusEnum } from '../blog.enum';
import { BlogLike } from './blog-like.entity';
import { slugify } from 'transliteration';
import { Op } from 'sequelize';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { LangEnum } from '@src/user/user.enum';

@Table
@ObjectType()
export class Blog extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Column({ type: DataType.STRING })
  @Field({ nullable: true })
  code: string;

  @Index
  @ForeignKey(() => BlogCategory)
  @AllowNull(true)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE' })
  categoryId: number;

  @BelongsTo(() => BlogCategory, 'categoryId')
  category: BlogCategory;

  @Index
  @ForeignKey(() => Lecturer)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  @Field(() => ID, { nullable: true })
  lecturerId: string;

  @BelongsTo(() => Lecturer)
  @Field(() => Lecturer, { nullable: true })
  lecturer: Lecturer;

  @Unique('unique_blog_titles')
  @Column({ type: DataType.STRING })
  @Field({ nullable: true })
  enTitle: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  @Field({ nullable: true })
  arTitle: string;

  @Column({ type: DataType.TEXT })
  @Field({ nullable: true })
  enContent: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({ nullable: true })
  arContent: string;

  @Column(getColumnEnum(BlogStatusEnum))
  @Field(() => BlogStatusEnum)
  status: BlogStatusEnum;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({ nullable: true })
  thumbnail?: string;

  @Default(0)
  @Column({ type: DataType.INTEGER })
  @Field({ defaultValue: 0 })
  viewsCount: number;

  @HasMany(() => BlogLike)
  likes: BlogLike[];

  @Default(0)
  @Column({ type: DataType.INTEGER })
  @Field({ defaultValue: 0 })
  likesCount: number;

  @Default(0)
  @Column({ type: DataType.INTEGER })
  @Field({ defaultValue: 0 })
  sharesCount: number;

  @Default(0)
  @Column({ type: DataType.INTEGER })
  @Field({ defaultValue: 0 })
  reportsCount: number;

  @BelongsToMany(() => Tag, () => BlogTag)
  @Field(() => [Tag], { nullable: true })
  tags: Tag[];

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({ nullable: true })
  altText: string;

  @Column({ type: DataType.STRING, defaultValue: null })
  @Field(() => String, { nullable: true })
  slug?: string;

  @Column({
    type: getColumnEnum(LangEnum),
    allowNull: true
  })
  @Field(() => LangEnum, { nullable: true })
  lang?: LangEnum;

  @Column({ type: DataType.DATE, allowNull: true })
  @Field(() => Timestamp, { nullable: true })
  publishedAt: Date;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  @Field()
  updatedAt: Date;

  @BeforeCreate
  // @BeforeUpdate
  static async generateSlug(instance: Blog) {
    if (instance.changed('enTitle') || !instance.slug) {
      let baseSlug = slugify(instance.enTitle, {
        lowercase: true
      });
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (
        await Blog.findOne({
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
  static async uniqueBlogTitle(instance: Blog) {
    if (
      (instance.enTitle || instance.arTitle) &&
      instance.status === BlogStatusEnum.PUBLISHED
    ) {
      const existingBlog = await Blog.findOne({
        where: {
          [Op.or]: [
            { enTitle: instance.enTitle },
            { arTitle: instance.arTitle }
          ],
          id: { [Op.ne]: instance.id },
          status: BlogStatusEnum.PUBLISHED
        }
      });

      if (existingBlog) {
        throw new BaseHttpException(ErrorCodeEnum.BLOG_TITLE_EXISTS);
      }
    }
  }

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include: any = [],
    attributes: any = [],
    isNestAndRaw: boolean = true
  ): Promise<PaginationRes<Blog>> {
    return paginate<Blog>(
      this,
      filter,
      sort,
      page,
      limit,
      include,
      attributes,
      isNestAndRaw
    );
  }

  static paginateManually(data: Blog[], page = 0, limit = 15) {
    return manualPaginator<Blog>(data, {}, '-createdAt', page, limit);
  }
}
