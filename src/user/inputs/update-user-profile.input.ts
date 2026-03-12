import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { ValidateName } from '../../auth/decorators/name-decorator';
import { ValidPhoneNumber } from '@src/_common/custom-validator/phone-number-validation';
import { Transform } from 'class-transformer';
import { ValidFilePath } from '@src/_common/custom-validator/valid-file-path';
import { IsNotBlank } from '@src/_common/custom-validator/not-bank.validator';

@InputType()
export class UpdateUserProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @ValidateName()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @ValidateName()
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @ValidateName()
  arFirstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @ValidateName()
  arLastName?: string;
}

@InputType()
export class UpdatePhone {
  @Transform(val => val.value.replace(/\s+/g, ''))
  @Transform(val => val.value.trim())
  @ValidPhoneNumber()
  @Field()
  phone: string;
}

@InputType()
export class updateProfilePicture {
  @IsNotBlank()
  @ValidFilePath()
  @Field()
  profilePicture?: string;
}

