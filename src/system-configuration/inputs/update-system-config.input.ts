import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsUrl,
  Matches,
  Min
} from 'class-validator';

@InputType()
export class UpdateSystemConfigInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  whatsapp?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  vat?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  paymentGatewayVat?: number;
}
