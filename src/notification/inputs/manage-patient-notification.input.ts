import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class ManagePatientNotificationsInput {
  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  VIA_PUSH?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  WHEN_APPOINTMENT_VISIT_SUMMARY_ADDED?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  WHEN_APPOINTMENT_PRESCRIPTIONS_ADDED?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  WHEN_APPOINTMENT_SICK_LEAVE_ADDED?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  WHEN_SCHEDULED_APPOINTMENT_ALARM?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  WHEN_APPOINTMENT_REPLIED?: boolean;
}
