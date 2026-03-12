import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ReportReasonEnum } from '../enums/report-reasons.enum';
import { ReportStatusEnum } from '../enums/report-status.enum';
import { ReportTargetEnum } from '../enums/report-targets.enum';
import { ReporterTypeEnum } from '../enums/reporter-type.enum';

@InputType()
export class AddReportInput {
  @Field(() => ReportReasonEnum)
  reason: ReportReasonEnum;

  @Field(() => ReportTargetEnum)
  targetType: ReportTargetEnum;

  @Field(() => String)
  targetId: string;

  @TextValidation({ minLength: 2, maxLength: 500, allowArabic: true })
  @Field(() => String)
  content: string;

  @IsEmail()
  @IsOptional()
  @Field(() => String, {
    nullable: true
  })
  email: string;

  @IsString()
  @IsOptional()
  @Field(() => String, {
    nullable: true
  })
  fullname: string;
}

@InputType()
export class GetReportsFilter {
  @Field(() => String, {
    nullable: true
  })
  searchKey?: string;

  @Field(() => ReportTargetEnum, {
    nullable: true
  })
  targetType: ReportTargetEnum;

  @Field(() => ReportStatusEnum, {
    nullable: true
  })
  status: ReportStatusEnum;

  @Field(() => ReporterTypeEnum, {
    nullable: true
  })
  reporterType: ReporterTypeEnum;

  @Field(() => ReportReasonEnum, {
    nullable: true
  })
  reason: ReportReasonEnum;
}

@ArgsType()
export class GetReportsFilterInput {
  @Field({
    nullable: true
  })
  filter?: GetReportsFilter;
}
