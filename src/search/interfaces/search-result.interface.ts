import { Field, ObjectType } from '@nestjs/graphql';
import { Category } from '@src/course-specs/category/category.model';
import { SearchSpaceEnum } from '../enums/search-space.enum';

@ObjectType()
export class SearchResult {
  @Field()
  id: string;

  @Field({ nullable: true })
  arTitle?: string;

  @Field({ nullable: true })
  enTitle?: string;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field(() => SearchSpaceEnum)
  type: SearchSpaceEnum;

  @Field(() => Category)
  category: Category;

  // @Field(()=>PublicationStatusEnum)
  // publicationStatus:PublicationStatusEnum;
}
