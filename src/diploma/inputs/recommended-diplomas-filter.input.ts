import { Field, InputType } from '@nestjs/graphql';
import { DiplomaTypeEnum } from '../enums/diploma-type.enum';

@InputType()
export class RecommendedDiplomasFilterInput {
  @Field(() => DiplomaTypeEnum, { nullable: true })
  diplomaType: DiplomaTypeEnum;
}
