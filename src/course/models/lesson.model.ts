import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  AfterCreate,
  AllowNull,
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  CreatedAt,
  Default
} from 'sequelize-typescript';
import { getColumnEnum } from '../../_common/utils/columnEnum';
import { LessonTypeEnum } from '../enums/course.enum';
import { LessonResourcesType } from '../interfaces/course.type';
import { Section } from './section.model';
import { UserLessonProgress } from './user-lesson-progress.model';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';
import { paginate } from '@src/_common/paginator/paginator.service';
import { User } from '@src/user/models/user.model';
import { QuizDurationEnum } from '@src/quiz/enum/quiz.enum';
import { QuizQuestion } from '@src/quiz/models/quiz-question.model';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';

@ObjectType()
@Table
export class Lesson extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  @Field(() => Int)
  id: number;

  @ForeignKey(() => Section)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  sectionId: string;

  @BelongsTo(() => Section, { onDelete: 'CASCADE' })
  @Field(() => Section, { nullable: true })
  section: Section;

  @Column
  @Field({ nullable: true })
  enTitle: string;

  @Column
  @Field({ nullable: true })
  arTitle: string;

  @Column(getColumnEnum(LessonTypeEnum))
  @Field(() => LessonTypeEnum, { nullable: true })
  type: LessonTypeEnum;

  @Field(() => Int, { nullable: true })
  @Column({ type: DataType.INTEGER })
  learningTimeInMinutes: number;

  @Column
  @Field({ nullable: true })
  isPreview: boolean;

  @Field(() => Int, { nullable: true })
  @Column
  order: number;

  // ---------- ARTICLE ----------
  @Field({ nullable: true })
  @Column(DataType.TEXT)
  content: string;

  @Field({ nullable: true })
  @AllowNull
  @Column(DataType.TEXT)
  overview: string;

  // ---------- VIDEO ----------
  @Field({ nullable: true })
  @Column(DataType.STRING)
  videoId: string;

  @Field({ nullable: true })
  @Column(DataType.STRING)
  videoUrl: string;

  // ---------- LIVE_SESSION ----------
  @Field(() => Timestamp, { nullable: true })
  @Column(DataType.DATE)
  liveSessionStartAt: Date;

  @Field(() => Timestamp, { nullable: true })
  @Column(DataType.DATE)
  liveSessionEndAt: Date;

  // ---------- RESOURCES ----------
  @Field(() => [LessonResourcesType], { nullable: 'itemsAndList' })
  @Column(DataType.JSONB)
  resources: LessonResourcesType[];

  // ---------- QUIZ ----------
  @Field(() => Number, { nullable: true })
  @Column({ type: DataType.FLOAT })
  passingGrade: number;

  @Field(() => Number, { nullable: true })
  @Column({ type: DataType.FLOAT })
  duration: number;

  @Field(() => QuizDurationEnum, { nullable: true })
  @Column({ type: getColumnEnum(QuizDurationEnum) })
  durationType: QuizDurationEnum;

  @Field(() => Int, { nullable: true })
  @Column({ type: DataType.INTEGER })
  attemptsAllowed: number;

  @Field(() => Boolean, { nullable: true })
  @Default(false)
  @Column({ defaultValue: false })
  showCorrectAnswers: boolean;

  @Field(() => [QuizQuestion], { nullable: true })
  @HasMany(() => QuizQuestion, { foreignKey: 'lessonId', onDelete: 'CASCADE' })
  questions: QuizQuestion[];

  @Default(0)
  @Column({ type: DataType.INTEGER })
  @Field(() => Number, { nullable: true, defaultValue: 0 })
  numberOfQuestions: number;

  // ---------- RELATIONS ----------
  @BelongsToMany(() => User, () => UserLessonProgress)
  users: User[];

  @HasMany(() => UserLessonProgress)
  progress: UserLessonProgress[];

  @CreatedAt
  @Column({ type: DataType.DATE })
  @Field(() => Date, { nullable: true })
  createdAt: Date;

  // ---------- STATIC ----------
  @AfterCreate
  static async autoAssignOrder(section: Section) {
    if (section.order === undefined || section.order === null) {
      const maxOrder = (await Section.max('order', {
        where: { courseId: section.courseId }
      })) as number;
      section.order = maxOrder ? maxOrder + 1 : 1;
      await section.save();
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
