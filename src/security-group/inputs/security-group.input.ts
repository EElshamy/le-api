import { Field, ArgsType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@ArgsType()
export class SecurityGroupInput {
  @IsNotEmpty()
  @IsUUID('4')
  @Field()
  securityGroupId: string;
}
