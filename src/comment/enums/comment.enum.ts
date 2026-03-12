import { registerEnumType } from '@nestjs/graphql';

export enum CommentSortEnum {
  createdAt = 'createdAt',
  numberOfReplies = 'numberOfReplies'
}
registerEnumType(CommentSortEnum, {
  name: 'CommentSortEnum',
  description: 'Sort comments by'
});
