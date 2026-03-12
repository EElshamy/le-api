import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsNumber,
  IsOptional,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';

@InputType()
export class UpdateReviewInput {
  @Field()
  reviewId: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(3)
  @MaxLength(500)
  review?: string;
}
