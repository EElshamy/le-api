import { ArgsType, Field, ID, InputType } from '@nestjs/graphql';
import {
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf
} from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';

@InputType()
export class UsersBoardFilter {
  @IsOptional()
  @IsNotBlank()
  @MaxLength(100)
  @Field({ nullable: true })
  searchKey?: string;

  @IsOptional()
  @Field({ nullable: true })
  isBlocked?: boolean;

  @IsOptional()
  @Field({ nullable: true })
  isDeleted?: boolean;

  @IsOptional()
  @Field({ nullable: true })
  notAssignedToCourseId?: string;
}

@ArgsType()
export class UsersBoardInput {
  @IsOptional()
  @ValidateNested(UsersBoardFilter)
  @Field({ nullable: true })
  filter?: UsersBoardFilter;
}

@ArgsType()
export class UserBoardInput {
  @ValidateIf(o => !o.code)
  @IsUUID('4')
  @IsNotBlank()
  @Field(() => ID, { nullable: true })
  userId?: string;

  @ValidateIf(o => !o.userId)
  @Matches(/^U-\d{8}$/, { message: 'Invalid user code' })
  @Field(() => String, { nullable: true })
  code?: string;
}

@ArgsType()
export class UserInput {
  @IsNotBlank()
  @IsUUID('4')
  @Field(() => ID)
  userId: string;
}

@ArgsType()
export class NullableUserIdInput {
  @IsOptional()
  @Field(() => ID, { nullable: true })
  userId?: string;
}
