import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf
} from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ReplyRequestStatusEnum } from '../enums/course.enum';

@InputType()
export class ReplyCourseRequest {
  @Field(() => ID)
  @IsUUID()
  courseId: string;

  @IsNotEmpty()
  @IsEnum(ReplyRequestStatusEnum)
  @Field(type => ReplyRequestStatusEnum)
  status: ReplyRequestStatusEnum;

  @ValidateIf(o => o.status === ReplyRequestStatusEnum.REJECTED)
  @IsNotEmpty({ message: 'Reject reason is required when the status is REJECTED.' })
  @IsNotBlank()
  @MinLength(0)
  @MaxLength(200)
  @Field({ nullable: true })
  rejectReason?: string;

}
