import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';
import { PasswordValidator } from '../../_common/custom-validator/password-validator.decorator';
import { EmailValidationConditions } from '../../auth/auth.constants';
import { ValidateName } from '../../auth/decorators/name-decorator';

@InputType()
export class CreateAdministratorBoardInput {
  @Field()
  @ValidateName(1, 25)
  firstName: string;

  @Field()
  @ValidateName(1, 25)
  lastName: string;

  @Transform(val => val.value.toLowerCase())
  @IsEmail(...EmailValidationConditions)
  @Field()
  email: string;

  @Field()
  @PasswordValidator()
  password: string;

  @Field()
  @IsString()
  securityGroupId: string;
}
