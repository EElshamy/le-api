import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { ResourceTypeEnum } from '../enums/course.enum';

@ObjectType()
export class LessonResourcesType {
  @Field()
  url: string;

  @Field(() => ResourceTypeEnum)
  type: ResourceTypeEnum;

  @Field({ nullable: true })
  downloadUrl?: string; // Nullable field for attachment URLs
}

@ObjectType()
export class UserCourseProgress {
  @Field(() => Int, { description: 'Number of completed lessons by the user' })
  completedLessons: number;

  @Field(() => Int, { description: 'Total lessons in the course' })
  totalLessons: number;

  @Field(() => Timestamp, {
    description: 'When the user joined the course',
    nullable: true
  })
  joinedAt: Date;
}
