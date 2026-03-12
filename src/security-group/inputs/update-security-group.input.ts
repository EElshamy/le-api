import { Field, InputType } from '@nestjs/graphql';
import { ValidPermissions } from '@src/_common/custom-validator/valid-permissions';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType()
export abstract class UpdateSecurityGroupInput {
  @IsNotEmpty()
  @IsUUID('4')
  @Field()
  readonly securityGroupId: string;

  @IsOptional()
  @Field({ nullable: true })
  readonly groupName?: string;

  @IsOptional()
  @Field({ nullable: true })
  readonly description?: string;

  @IsOptional()
  @ValidPermissions()
  @Field(type => [String], { nullable: 'itemsAndList' })
  readonly permissions?: string[];

  @Field({ defaultValue: true })
  readonly isActive: boolean;
}
