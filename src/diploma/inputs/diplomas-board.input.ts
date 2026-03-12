import { Field, InputType } from '@nestjs/graphql';
import { DiplomaStatusEnum } from '../enums/diploma-status.enum';
import { ContentLevelEnum } from '@src/course/enums/course.enum';

@InputType()
export class diplomasBoardFilterInput {
  @Field(() => DiplomaStatusEnum)
  status?: DiplomaStatusEnum;

  @Field(() => ContentLevelEnum)
  level?: ContentLevelEnum;

  @Field({ nullable: true })
  searchKey?: string;
}
import { ObjectType } from '@nestjs/graphql';
