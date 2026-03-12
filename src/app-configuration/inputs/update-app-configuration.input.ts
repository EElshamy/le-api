import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class UpdateAppConfigurationInput {
  @IsNotEmpty()
  @IsUUID('4')
  @Field(type => ID)
  appConfigurationId: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  key?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  value?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  displayAs?: string;
}
