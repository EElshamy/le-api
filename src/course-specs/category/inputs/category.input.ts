import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsPositive, ValidateIf } from 'class-validator';

@ArgsType()
export class CategoryInput {
  @ValidateIf((o) => !o.slug) 
  @IsPositive()
  @IsOptional()
  @Field(() => Int, { nullable: true })
  categoryId?: number;

  @ValidateIf((o) => !o.categoryId)
  @IsOptional()
  @Field(() => String, { nullable: true })
  slug?: string;
}