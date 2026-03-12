import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsUUID,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf
} from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { ReplyLecturerRequestStatusEnum } from '../enums/lecturer.enum';

@InputType()
export class AcceptedLecturerRequestInput {
  @Field()
  @IsNotEmpty()
  @IsUrl()
  uploadedMaterialUrl: string;

  @Field(() => Int)
  @Min(0)
  @Max(100)
  commissionPercentage: number;
}

@InputType()
export class RejectedLecturerRequestInput {
  @IsNotBlank()
  @Field({ nullable: false })
  @MinLength(2)
  @MaxLength(200)
  @IsNotEmpty()
  rejectReason?: string;
}

@InputType()
export class ReplyLecturerJoinRequestInput {
  @IsUUID('4')
  @Field(type => ID)
  lecturerRequestId: string;

  @IsNotEmpty()
  @IsEnum(ReplyLecturerRequestStatusEnum)
  @Field(type => ReplyLecturerRequestStatusEnum)
  status: ReplyLecturerRequestStatusEnum;

  @ValidateIf(o => o.status === ReplyLecturerRequestStatusEnum.REJECTED)
  @ValidateNested(RejectedLecturerRequestInput)
  @IsOptional()
  @Field(() => RejectedLecturerRequestInput, { nullable: true })
  rejectionInput?: RejectedLecturerRequestInput;

  @ValidateIf(o => o.status === ReplyLecturerRequestStatusEnum.APPROVED)
  @ValidateNested(AcceptedLecturerRequestInput)
  @IsNotEmptyObject()
  @Field(() => AcceptedLecturerRequestInput, { nullable: true })
  acceptanceInput?: AcceptedLecturerRequestInput;


}
