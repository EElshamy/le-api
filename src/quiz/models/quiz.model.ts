// import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
// import {
//   BelongsTo,
//   Column,
//   CreatedAt,
//   DataType,
//   Default,
//   ForeignKey,
//   HasMany,
//   Model,
//   PrimaryKey,
//   Table
// } from 'sequelize-typescript';
// import { QuizDurationEnum, QuizRelatedTypeEnum } from '../enum/quiz.enum';
// import { getColumnEnum } from '@src/_common/utils/columnEnum';
// import { QuizQuestion } from './quiz-question.model';
// import { Course } from '@src/course/models/course.model';
// import { Diploma } from '@src/diploma/models/diploma.model';
// import { Lesson } from '@src/course/models/lesson.model';

// @ObjectType()
// @Table
// export class Quiz extends Model {
//   @PrimaryKey
//   @Default(DataType.UUIDV4)
//   @Column({ type: DataType.UUID })
//   @Field(() => ID)
//   id: string;

//   // @Field(() => String)
//   // @Column({ type: DataType.STRING })
//   // enTitle: string;

//   // @Field(() => String)
//   // @Column({ type: DataType.STRING })
//   // arTitle: string;

//   @Field(() => Number)
//   @Column({ type: DataType.FLOAT })
//   passingGrade: number;

//   @Field(() => Number)
//   @Column({ type: DataType.FLOAT })
//   duration: number;

//   @Field(() => QuizDurationEnum)
//   @Column({ type: getColumnEnum(QuizDurationEnum) })
//   durationType: QuizDurationEnum;

//   @Field(() => Int)
//   @Column({ type: DataType.INTEGER })
//   attemptsAllowed: number;

//   @Field(() => Boolean, { defaultValue: false })
//   @Column({ defaultValue: false })
//   showCorrectAnswers: boolean;

//   // @Field(() => String, { nullable: true })
//   // @Column({ type: DataType.STRING })
//   // relatedId?: string;

//   // @Field(() => QuizRelatedTypeEnum, { nullable: true })
//   // @Column({ type: getColumnEnum(QuizRelatedTypeEnum) })
//   // relatedType?: QuizRelatedTypeEnum;

//   @Field(() => Lesson)
//   @BelongsTo(() => Lesson, { foreignKey: 'lessonId', onDelete: 'CASCADE' })
//   lesson: Lesson;

//   @ForeignKey(() => Lesson)
//   @Column({ type: DataType.INTEGER })
//   lessonId: number;

//   @Field(() => [QuizQuestion], { nullable: true })
//   @HasMany(() => QuizQuestion)
//   questions: QuizQuestion[];

//   @Default(0)
//   @Column({ type: DataType.INTEGER })
//   @Field(() => Number, { nullable: true, defaultValue: 0 })
//   numberOfQuestions: number;

//   @CreatedAt
//   @Column({ type: DataType.DATE })
//   @Field(() => Date, { nullable: true })
//   createdAt: Date;
// }
