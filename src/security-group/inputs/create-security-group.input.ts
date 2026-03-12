import { Field, InputType } from '@nestjs/graphql';
import { ValidPermissions } from '@src/_common/custom-validator/valid-permissions';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export abstract class CreateSecurityGroupInput {
  @IsNotEmpty()
  @Field()
  readonly groupName: string;

  @IsOptional()
  @Field({ nullable: true })
  readonly description?: string;

  @ValidPermissions()
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @Field(type => [String])
  readonly permissions: string[];

  @Field({ defaultValue: true })
  readonly isActive: boolean;
}
