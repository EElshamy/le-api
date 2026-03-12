import { InputType, Field } from '@nestjs/graphql';
import { PasswordValidator } from '../../_common/custom-validator/password-validator.decorator';
import { IsOptional } from 'class-validator';
import { IsNotBlank } from '../../_common/custom-validator/not-bank.validator';

@InputType()
export class ChangePasswordInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNotBlank()
  oldPassword: string;

  @Field()
  @PasswordValidator()
  newPassword: string;

  // @Field()
  // @PasswordValidator()
  // confirmPassword: string;
}

@InputType()
export class ChangePasswordBoardInput {
  @Field()
  @IsNotBlank()
  oldPassword: string;

  @Field()
  @PasswordValidator()
  newPassword: string;
}
