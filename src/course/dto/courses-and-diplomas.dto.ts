import { Field, ObjectType } from '@nestjs/graphql';
import { UpperCaseLearningProgramTypeEnum } from '@src/cart/enums/cart.enums';

@ObjectType()
export class CourseAndDiplomas {
  @Field()
  id: string;

  @Field(() => String, { nullable: true })
  arTitle: string;

  @Field(() => String, { nullable: true })
  enTitle: string;

  @Field(() => String, { nullable: true })
  thumbnail: string;

  @Field(() => UpperCaseLearningProgramTypeEnum, { nullable: true })
  learningProgramType: UpperCaseLearningProgramTypeEnum;

  @Field(() => String, { nullable: true })
  code?: string;
}
