import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { FaqForEnum } from '../enums/faq.enum';

@InputType()
export class FaqFilterBoard {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  searchKey?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field(() => FaqForEnum, { nullable: true })
  @IsEnum(FaqForEnum)
  @IsOptional()
  for?: FaqForEnum;
}

@ArgsType()
export class FaqFilterInputBoard {
  @Field({ nullable: true })
  filter?: FaqFilterBoard;
}
