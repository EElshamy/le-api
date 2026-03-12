import { Field, InputType } from '@nestjs/graphql';
import { UpperCaseLearningProgramTypeEnum } from '@src/cart/enums/cart.enums';

@InputType()
export class CertificationFilter {
  @Field({ nullable: true })
  learningProgramId?: string;

  @Field({ nullable: true })
  learningProgramType?: UpperCaseLearningProgramTypeEnum;

  @Field({ nullable: true })
  userId?: string;

  @Field(() => Boolean, { nullable: true })
  myCertifications?: boolean;
}
