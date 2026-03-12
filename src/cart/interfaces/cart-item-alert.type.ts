import { Field, ObjectType } from '@nestjs/graphql';

export interface CartItemAlertType {
  text: string;
  color: string;
}

@ObjectType()
export class CartItemAlertObjectType {
  @Field(() => String, { nullable: true })
  text: string;
  @Field(() => String, { nullable: true })
  color: string;
}
