import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class BlogMetricsInput {
  @Field(() => Boolean, { nullable: true })
  views: boolean;

  @Field(() => Boolean, { nullable: true })
  shares: boolean;
}
