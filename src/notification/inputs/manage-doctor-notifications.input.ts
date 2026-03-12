import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class ManageDoctorNotificationsInput {
  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  VIA_PUSH?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  WHEN_SCHEDULED_APPOINTMENT_ALARM?: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  WHEN_APPOINTMENT_CANCELED: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  WHEN_APPOINTMENT_NEED_SUMMARY: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  WHEN_APPOINTMENT_REVIEWED: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  WHEN_NEW_APPOINTMENT: boolean;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  WHEN_APPOINTMENT_INCOME_ADDED_TO_DOCTOR_WALLET: boolean;
}
