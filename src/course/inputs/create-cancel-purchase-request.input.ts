import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CancelPurchaseRequestInput {
  @Field(() => String)
  @IsUUID('4')
  courseId: string;

  @Field(() => String)
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  reason: string;
}
