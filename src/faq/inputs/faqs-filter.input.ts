import { InputType, Field, ArgsType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class FaqsFilter {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  searchKey?: string;
}

@ArgsType()
export class FaqsFilterInput {
  @Field({ nullable: true })
  filter?: FaqsFilter;
}
