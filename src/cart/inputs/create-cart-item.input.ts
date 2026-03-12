import { Field, InputType } from '@nestjs/graphql';
import { LearningProgramTypeEnum } from '../enums/cart.enums';

@InputType()
export class CreateCartItemInput {
  @Field()
  learningProgramId: string;

  @Field(() => LearningProgramTypeEnum)
  learningProgramType: LearningProgramTypeEnum;
}
