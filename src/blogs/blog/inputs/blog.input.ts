import { ArgsType, Field } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@ArgsType()
export class BlogInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  blogId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  slug?: string;
}
