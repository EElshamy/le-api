import { Field, ObjectType } from '@nestjs/graphql';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { generateGqlResponseType } from './graphql-response.type';

@ObjectType('SiteMapResponse')
export class SiteMapResponse {
  @Field()
  id: string;

  @Field({ nullable: true })
  type?: LearningProgramTypeEnum;

  @Field({ nullable: true })
  updatedAt: string;
}

export const GqlSiteMapResponse = generateGqlResponseType(
  [SiteMapResponse],
  true
);
