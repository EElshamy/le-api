import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateCartInput {
  @Field({ nullable: true })
  userId?: string;
}
