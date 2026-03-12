import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class AssignSecurityGroupToUsersInput {
  @IsNotEmpty()
  @IsUUID('4')
  @Field()
  securityGroupId: string;

  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @Field(type => [String])
  usersIds: string[];
}
