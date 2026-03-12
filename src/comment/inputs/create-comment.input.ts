import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field(() => String)
  @IsNotEmpty()
  @MaxLength(5000)
  @IsString()
  content: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  courseId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  lectureId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  parentCommentId: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString({ each: true })
  attachments?: string[];
}

@InputType()
export class EditCommentInput {
  @Field(() => String)
  commentId: string;

  @Field(() => String)
  @IsNotEmpty()
  @MaxLength(5000)
  @IsString()
  content: string;
}
