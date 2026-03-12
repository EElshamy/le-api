import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ValidateLanguage } from '../../_common/custom-validator/lang-validator';
import { LangEnum } from '../../user/user.enum';

@InputType()
export class UpdateJobTitleBoardInput {
  @IsUUID('4')
  @Field(type => ID)
  jobTitleId: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  @MaxLength(70)
  @ValidateLanguage(LangEnum.AR)
  arName: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  @MaxLength(70)
  @ValidateLanguage(LangEnum.EN)
  enName: string;

  @Field({ defaultValue: true })
  isActive: boolean;
}
