import { InputType, PartialType } from '@nestjs/graphql';
import { CreateBlogInput } from './ceate-blog.input';
@InputType()
export class CreateDraftBlogInput extends PartialType(CreateBlogInput) {}
