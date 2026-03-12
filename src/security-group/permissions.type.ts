import { Field, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@ObjectType()
export class PermissionsGroups {
  @IsString()
  @Field(() => String)
  groupName: string;

  @Field(() => [String])
  permissions: string[];
}
