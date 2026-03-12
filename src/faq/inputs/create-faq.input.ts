import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FaqForEnum } from '../enums/faq.enum';

@InputType()
export class CreateFaqInput {
  @IsString()
  @Field({ nullable: true })
  @IsOptional()
  enQuestion: string;

  @IsString()
  @Field({ nullable: true })
  @IsOptional()
  arQuestion: string;

  @IsString()
  @Field({ nullable: true })
  @IsOptional()
  enAnswer: string;

  @IsString()
  @Field({ nullable: true })
  @IsOptional()
  arAnswer: string;

  @IsOptional()
  @Field(() => FaqForEnum, { defaultValue: FaqForEnum.ALL, nullable: true })
  @IsEnum(FaqForEnum)
  for: FaqForEnum;

  @Field(() => Boolean)
  isPublished: boolean;
}
