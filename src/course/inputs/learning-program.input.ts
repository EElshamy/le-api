import { Field, InputType } from '@nestjs/graphql';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';

@InputType()
export class LearningProgramInput {
  @Field()
  learningProgramId: string;

  @Field(() => LearningProgramTypeEnum)
  learningProgramType: LearningProgramTypeEnum;
}
