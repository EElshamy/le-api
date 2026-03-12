import { InputType, Field } from '@nestjs/graphql';
import { ArrayMinSize, IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class UnAssignSecurityGroupToUsersInput {
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @Field(type => [String])
  usersIds: string[];
}
