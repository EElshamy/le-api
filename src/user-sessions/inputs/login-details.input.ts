import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transaction } from 'sequelize';
import { DeviceEnum } from '../../user/user.enum';
import { ActionTypeEnum } from '../user-sessions.enum';

@InputType()
export class LoginDetailsInput {
  @Field()
  // @MaxLength(250)
  deviceName: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  fcmToken?: string;

  @Field(type => DeviceEnum)
  @IsEnum(DeviceEnum)
  device: DeviceEnum;

  ipAddress?: string;

  actionType?: ActionTypeEnum;

  userId?: string;

  transaction?: Transaction;

  isActive?: boolean;
}
