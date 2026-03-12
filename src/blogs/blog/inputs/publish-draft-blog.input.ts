import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class PublishDraftBlogInput {
  @Field()
  blogId: string;
}
