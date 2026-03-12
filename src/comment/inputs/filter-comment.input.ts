import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

@ArgsType()
export class CommentIdInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  commentId: string;
}

@ArgsType()
@InputType()
export class CommentFilterInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  lectureId: string;
}

@ArgsType()
export class NullableCommentFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @ValidateNested()
  filter?: CommentFilterInput;
}
