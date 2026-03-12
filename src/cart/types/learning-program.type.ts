import { Field, ObjectType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { ContentLevelEnum } from '@src/course/enums/course.enum';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { Course } from '@src/course/models/course.model';
import { ILearningProgram } from '@src/learning-program/interfaces/learning-program.interface';
import { Lecturer } from '@src/lecturer/models/lecturer.model';


@ObjectType()
export class LearningProgram implements ILearningProgram {
  @Field()
  id: string;

  @Field()
  code: string;

  @Field({ nullable: true })
  thumbnail: string;

  @Field({ nullable: true })
  level: ContentLevelEnum;

  @Field({ nullable: true })
  arTitle: string;

  @Field({ nullable: true })
  enTitle: string;

  // @Field()
  // lecturerId: string;

  // @Field({ nullable: true })
  // lecturer: Lecturer;

  @Field(() => [CourseLecturer], { nullable: true })
  courseLecturers: CourseLecturer[];

  @Field({ nullable: true })
  commissionPercentage: number;

  @Field(() => Number, { nullable: true })
  @Field(() => MoneyScalar, { nullable: true })
  originalPrice: number;

  @Field(() => MoneyScalar, { nullable: true })
  priceAfterDiscount: number;

  @Field({ nullable: true })
  learningTime: number;

  @Field()
  remoteProductId: string;

  @Field({ nullable: true })
  promoVideo: string;

  @Field({ nullable: true })
  slug: string;
}
