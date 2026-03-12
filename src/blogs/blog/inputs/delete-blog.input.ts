import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@ArgsType()
export class DeleteBlogInput {
  @IsNotEmpty()
  @Field(type => String)
  blogId: string;
}
