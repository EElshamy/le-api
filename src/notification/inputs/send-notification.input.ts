import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsNotEmpty, IsString } from 'class-validator';
import { NotificationTypeEnum } from '../notification.enum';

@InputType()
export class SendNotificationInput {
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @Field(type => [String])
  usersIds: string[];

  @Field(type => NotificationTypeEnum)
  notificationType: NotificationTypeEnum;

  @IsNotEmpty()
  @IsString()
  @Field()
  enTitle: string;

  @IsNotEmpty()
  @IsString()
  @Field()
  arTitle: string;

  @IsNotEmpty()
  @IsString()
  @Field()
  enBody: string;

  @IsNotEmpty()
  @IsString()
  @Field()
  arBody: string;
}
