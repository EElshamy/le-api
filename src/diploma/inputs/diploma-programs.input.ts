import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class DiplomaProgramsInput {
  @Field()
  diplomaId: string;
  // @Field(() => CourseTypeEnum, { nullable: true })
  // programType?: CourseTypeEnum;
  // @Field({ nullable: true, description: 'user id of lecturer' })
  // userIdOfLecturer?: string;
}
