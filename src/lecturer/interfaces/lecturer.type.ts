import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { CommissionType } from '@src/course/enums/course.enum';

@ObjectType()
export class YearsOfExperienceRange {
  @Field(() => Int)
  start: number;

  @Field(() => Int)
  end: number;

  @Field()
  label: string;
}

@ObjectType()
export class LecturerCommissionUnderCourse {
  @Field(() => Float)
  commission: number;

  @Field(() => CommissionType)
  commissionType: CommissionType;
}
