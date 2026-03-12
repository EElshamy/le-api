import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LecturerLearningProgram {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  type: string;

  @Field(() => String, { nullable: true })
  enTitle?: string;

  @Field(() => String, { nullable: true })
  arTitle?: string;

  @Field(() => String, { nullable: true })
  thumbnail?: string;

  @Field(() => String)
  status: string;

  @Field(() => String)
  publicationStatus: string;

  @Field(() => String)
  categoryEnName: string;

  @Field(() => String)
  categoryArName: string;

  @Field(() => Float)
  revenue: number;

  @Field(() => Int, { nullable: true })
  enrolledUsersCount?: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  publishedAt: Date;
}
