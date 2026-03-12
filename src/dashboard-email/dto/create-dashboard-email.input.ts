import { InputType, Int, Field } from '@nestjs/graphql';
import { text } from 'pdfkit';
import { DashboardEmailTypeEnum } from '../types/dashboard-email.type';
import { IsEnum, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateDashboardEmailInput {
  @MinLength(2)
  @MaxLength(200)
  @Field(() => String, { nullable: false })
  title: string;

  @MinLength(10)
  @MaxLength(5000)
  @Field(() => String, { nullable: false })
  description: string;

  @Field(() => DashboardEmailTypeEnum, { nullable: false , defaultValue: DashboardEmailTypeEnum.ALL })
  @IsEnum(DashboardEmailTypeEnum)
  target: DashboardEmailTypeEnum;
}
