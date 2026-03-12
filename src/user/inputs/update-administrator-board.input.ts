import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { CreateAdministratorBoardInput } from './create-administrator.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateAdministratorBoardInput extends PartialType(CreateAdministratorBoardInput) {
  @IsUUID('4')
  @Field(type => ID, { nullable: true })
  userId: string;
}
