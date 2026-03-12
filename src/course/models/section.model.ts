import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';
import {
  AfterCreate,
  AfterDestroy,
  AfterUpdate,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
import { paginate } from '../../_common/paginator/paginator.service';
import { Course } from './course.model';
import { Lesson } from './lesson.model';

@Table
@ObjectType()
export class Section extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @ForeignKey(() => Course)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  courseId: string;

  @BelongsTo(() => Course, { onDelete: 'CASCADE' })
  @Field(() => Course, { nullable: true })
  course: Course;

  @Column
  @Field()
  enTitle: string;

  @Column
  @Field()
  arTitle: string;

  @Field(() => Int)
  @Column
  order: number;

  @Default(0)
  @Field(() => Int, { defaultValue: 0 })
  @Column
  videosCount: number;

  @Default(0)
  @Field(() => Int, { defaultValue: 0 })
  @Column
  articlesCount: number;

  @Default(0)
  @Field(() => Int, { defaultValue: 0 })
  @Column
  liveSessionsCount: number;

  @Default(0)
  @Field(() => Int, { defaultValue: 0 })
  @Column
  quizzesCount: number;

  @Default(0)
  @Field(() => Int, { defaultValue: 0 })
  @Column
  learningTimeInMinutes: number;

  @HasMany(() => Lesson, { onDelete: 'CASCADE' })
  @Field(() => [Lesson], { nullable: 'itemsAndList' })
  lessons: Lesson[];

  @AfterCreate
  @AfterUpdate
  @AfterDestroy
  static async updateLearningTime(section: Section) {
    const totalMinutes = await Lesson.sum('learningTimeInMinutes', {
      where: { sectionId: section.id }
    });
    await section.update({ learningTimeInMinutes: totalMinutes });
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
    return paginate<Section>(
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
