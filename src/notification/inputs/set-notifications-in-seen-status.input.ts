import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsNotEmpty } from 'class-validator';

@InputType()
export abstract class SetNotificationsInSeenStatusInput {
  @IsNotEmpty({ each: true })
  @IsUUID('4', { each: true })
  @Field(() => [String])
  notificationIds: string[];
}
