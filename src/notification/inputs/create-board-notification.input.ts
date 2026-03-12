import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { DeviceEnum } from '@src/user/user.enum';
import { IsString } from 'class-validator';
import { Column } from 'sequelize-typescript';

@InputType()
export class createBoardNotificationInput {
  @Field()
  @IsString()
  enTitle: string;

  @Field()
  @IsString()
  arTitle: string;

  @Field()
  @IsString()
  enBody: string;

  @Field()
  @IsString()
  arBody: string;

  @Field(() => DeviceEnum, { nullable: true })
  device?: DeviceEnum;
}
@InputType()
export class UpdateBoardNotificationInput extends PartialType(
  createBoardNotificationInput
) {
  @Field(() => ID)
  id: string;
}
