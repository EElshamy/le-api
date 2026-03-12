import { registerEnumType } from '@nestjs/graphql';

export enum BlogSortEnum {
  VIEWES = 'viewsCount',
  LIKES = 'likesCount',
  SHARES = 'sharesCount',
  UPDATED_AT = 'updatedAt',
  PUBLISHED_AT = 'publishedAt',
  CREATED_AT = 'createdAt'
}

registerEnumType(BlogSortEnum, { name: 'BlogSortEnum' });

export enum BlogStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED'
}
registerEnumType(BlogStatusEnum, { name: 'BlogStatusEnum' });
