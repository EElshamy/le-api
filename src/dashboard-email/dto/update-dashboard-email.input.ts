import { MaxLength, MinLength, ValidateIf } from 'class-validator';
import { DashboardEmailTypeEnum } from '../types/dashboard-email.type';
import { CreateDashboardEmailInput } from './create-dashboard-email.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateDashboardEmailInput {
  @Field(() => String, { nullable: false })
  id: string;

  @MinLength(2)
  @MaxLength(200)
  @ValidateIf(o => o.title !== undefined)
  @Field(() => String, { nullable: true })
  title: string;

  @MinLength(10)
  @MaxLength(5000)
  @ValidateIf(o => o.description !== undefined)
  @Field(() => String, { nullable: true })
  description: string;

  @Field(type => DashboardEmailTypeEnum , { nullable: true })
  target: DashboardEmailTypeEnum;
}
