import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsEmail } from 'class-validator';
import { EmailValidationConditions } from '../auth.constants';
import { Transform } from 'class-transformer';
import { LoginDetailsInput } from '../../user-sessions/inputs/login-details.input';
import { ValidateNested } from '../../_common/custom-validator/validate-nested.decorator';
import { BoardRoleEnum } from '../../user/user.enum';

@InputType()
export class EmailAndPasswordLoginInput {
  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @IsNotEmpty()
  @Field()
  email: string;

  @Field()
  password: string;

  @ValidateNested(LoginDetailsInput)
  @Field(() => LoginDetailsInput)
  loginDetails: LoginDetailsInput;
}

@InputType()
export class EmailAndPasswordLoginForBoardInput {
  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @IsNotEmpty()
  @Field()
  email: string;

  @Field()
  password: string;

  @Field(() => BoardRoleEnum, { deprecationReason: 'no longer needed', nullable: true })
  role: BoardRoleEnum;

  @ValidateNested(LoginDetailsInput)
  @Field(() => LoginDetailsInput)
  loginDetails: LoginDetailsInput;
}
