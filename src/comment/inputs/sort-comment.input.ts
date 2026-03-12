import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { CommentSortEnum } from '../enums/comment.enum';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';

@InputType()
export class CommentSortInput {
  @Field(() => CommentSortEnum, { defaultValue: CommentSortEnum.createdAt })
  @IsEnum(CommentSortEnum)
  sortBy?: CommentSortEnum;

  @Field(() => SortTypeEnum, { defaultValue: SortTypeEnum.DESC })
  sortType: SortTypeEnum;
}

@ArgsType()
export class NullableCommentSortInput {
  @Field({ nullable: true })
  @IsOptional()
  @ValidateNested()
  sort?: CommentSortInput;
}
