import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CalculatePricesUnderDiploma {
  @Field({ nullable: true })
  programId: string;

  @Field({ nullable: true })
  priceUnderDiploma: number;
}

@ObjectType()
export class coursesAndWorkshopsCountOutput {
  @Field(() => Int, { nullable: true })
  coursesCount: number;

  @Field(() => Int, { nullable: true })
  workshopsCount: number;

  @Field(() => Int, { nullable: true })
  totalLessonsCount: number;
}

export enum EmailToUsersTypeEnum {
  PRICE_DISCOUNT = 'PRICE_DISCOUNT',
  NEW_PROGRAM_AVAILABLE = 'NEW_PROGRAM_AVAILABLE'
}
