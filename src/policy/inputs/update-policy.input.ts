import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator';
import { PolicyEnum } from '../enums/policy.enum';

@InputType()
export class UpdatePolicyInput {
  @Field(() => PolicyEnum)
  @IsEnum(PolicyEnum)
  title: PolicyEnum;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  @MaxLength(20000)
  contentEn: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  @MaxLength(20000)
  contentAr: string;
}
