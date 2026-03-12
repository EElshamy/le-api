import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { BlogStatusEnum } from '../blog.enum';
import { CreateBlogInput } from './ceate-blog.input';

@InputType()
export class UpdateBlogInput extends PartialType(CreateBlogInput) {
  @IsNotEmpty()
  @Field(type => String)
  blogId: string;

  @Field(() => BlogStatusEnum, { nullable: true })
  @IsEnum(BlogStatusEnum)
  status: BlogStatusEnum;
}
