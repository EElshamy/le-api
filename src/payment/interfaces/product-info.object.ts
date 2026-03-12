import { Field, ObjectType } from '@nestjs/graphql';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';

@ObjectType()
export class ProductInfo {
  @Field({
    nullable: true
  })
  id: string;

  @Field({
    nullable: true
  })
  lecturerId: string;

  @Field({
    nullable: true
  })
  finalPrice: number;

  @Field({
    nullable: true
  })
  commissionPercentage: number;

  @Field(() => LearningProgramTypeEnum, { nullable: true })
  type: LearningProgramTypeEnum;

  @Field(() => LearningProgramTypeEnum, { nullable: true })
  parentType: LearningProgramTypeEnum;

  @Field({
    nullable: true
  })
  parentId: string;
}
