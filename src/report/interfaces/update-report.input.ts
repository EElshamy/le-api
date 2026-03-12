import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { ReportStatusEnum } from '../enums/report-status.enum';
import { AddReportInput } from './report-input.interface';

@InputType()
export class UpdateReportInput extends PartialType(AddReportInput) {
  @Field(() => Int)
  reportId: number;

  @Field(() => ReportStatusEnum, { nullable: true })
  status: ReportStatusEnum;
}
