import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { ValidateNested } from '@src/_common/custom-validator/validate-nested.decorator';
import { IsOptional, MaxLength } from 'class-validator';

@InputType()
export class AdministratorsBoardFilter {
  @IsOptional()
  @MaxLength(100)
  @Field({ nullable: true })
  searchKey?: string;

  @IsOptional()
  @Field({ nullable: true })
  securityGroupId?: string;
}

@ArgsType()
export class NullableAdministratorBoardFilter {
  @IsOptional()
  @ValidateNested(AdministratorsBoardFilter)
  @Field({ nullable: true })
  filter?: AdministratorsBoardFilter;
}
